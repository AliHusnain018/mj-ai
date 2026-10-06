/**
 * BrowserTaskManager - Orchestrates multi-step tasks, verification, retries, and cancellation
 */

import { BrowserActionRequest, BrowserActionResult, PageState } from './BrowserTypes';
import { BrowserBridge } from './BrowserBridge';
import { PageInspector } from './PageInspector';
import { ElementResolver } from './ElementResolver';
import { TargetMemory } from './TargetMemory';
import { ActionVerifier } from './ActionVerifier';

export type TaskStatus =
  | 'idle'
  | 'planning'
  | 'inspecting'
  | 'resolving'
  | 'executing'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled';

export class BrowserTaskManager {
  private static instance: BrowserTaskManager;
  private currentStatus: TaskStatus = 'idle';
  private currentActionId: string | null = null;
  private isCancelled = false;
  private statusListeners = new Set<(status: TaskStatus, details?: string) => void>();

  private bridge = BrowserBridge.getInstance();
  private inspector = PageInspector.getInstance();
  private targetMemory = TargetMemory.getInstance();

  private constructor() {}

  public static getInstance(): BrowserTaskManager {
    if (!BrowserTaskManager.instance) {
      BrowserTaskManager.instance = new BrowserTaskManager();
    }
    return BrowserTaskManager.instance;
  }

  public getStatus(): TaskStatus {
    return this.currentStatus;
  }

  public onStatusChange(listener: (status: TaskStatus, details?: string) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: TaskStatus, details?: string): void {
    this.currentStatus = status;
    this.statusListeners.forEach((fn) => fn(status, details));
  }

  public cancelCurrentTask(): void {
    this.isCancelled = true;
    this.setStatus('cancelled', 'Task cancelled by user');
  }

  /**
   * Executes a single or multi-step browser action with full perception, resolution, execution, and verification.
   */
  public async executeAction(request: BrowserActionRequest): Promise<BrowserActionResult> {
    const startTime = Date.now();
    this.isCancelled = false;
    this.currentActionId = request.actionId;

    try {
      // 1. Navigation / Open URL actions
      if (request.action === 'OPEN_URL' || request.action === 'NAVIGATE') {
        this.setStatus('executing', `Navigating to ${request.url}`);
        const openRes = await this.bridge.sendCommand(request.action, { url: request.url });
        await new Promise((r) => setTimeout(r, 600)); // Allow initial page load

        let inspectSummary = '';
        try {
          const pageState = await this.inspector.inspectCurrentPage();
          inspectSummary = this.inspector.generateCompactSummary(pageState);
          this.targetMemory.notifyNavigation(pageState.url);
        } catch {
          // Extension might still be connecting to tab
        }

        this.setStatus('completed');
        return {
          success: true,
          actionId: request.actionId,
          action: request.action,
          url: request.url,
          pageSummary: inspectSummary,
          spokenFeedback: `Opened ${request.url}. I can now see the page. What should I do next?`,
          latencyMs: Date.now() - startTime,
        };
      }

      // 2. Tab history navigation (Back, Forward, Reload)
      if (request.action === 'GO_BACK' || request.action === 'GO_FORWARD' || request.action === 'RELOAD') {
        this.setStatus('executing', `Performing ${request.action}`);
        await this.bridge.sendCommand(request.action);
        await new Promise((r) => setTimeout(r, 500));

        const pageState = await this.inspector.inspectCurrentPage().catch(() => null);
        const inspectSummary = pageState ? this.inspector.generateCompactSummary(pageState) : '';

        this.setStatus('completed');
        return {
          success: true,
          actionId: request.actionId,
          action: request.action,
          url: pageState?.url,
          title: pageState?.title,
          pageSummary: inspectSummary,
          spokenFeedback:
            request.action === 'GO_BACK'
              ? 'Navigated back to previous page.'
              : request.action === 'GO_FORWARD'
                ? 'Navigated forward.'
                : 'Page reloaded.',
          latencyMs: Date.now() - startTime,
        };
      }

      // 3. Scrolling
      if (request.action === 'SCROLL') {
        this.setStatus('executing', `Scrolling ${request.scrollParams?.direction || 'down'}`);
        const beforeState = await this.inspector.inspectCurrentPage().catch(() => null);
        const scrollRes = await this.bridge.sendCommand('SCROLL', {
          direction: request.scrollParams?.direction || 'down',
          amount: request.scrollParams?.amount || 'medium',
        });

        this.setStatus('verifying');
        const afterScrollY = scrollRes?.newScrollY ?? 0;
        const verification = ActionVerifier.verifyScroll(
          beforeState?.viewport?.scrollY ?? 0,
          afterScrollY,
          request.scrollParams?.direction || 'down'
        );

        this.setStatus('completed');
        return {
          success: true,
          actionId: request.actionId,
          action: 'SCROLL',
          verification,
          spokenFeedback: `Scrolled ${request.scrollParams?.direction || 'down'}.`,
          latencyMs: Date.now() - startTime,
        };
      }

      // 4. Media Control
      if (request.action === 'PLAY_MEDIA' || request.action === 'PAUSE_MEDIA' || request.action === 'SEEK_MEDIA') {
        const mediaAction =
          request.action === 'PLAY_MEDIA'
            ? 'play'
            : request.action === 'PAUSE_MEDIA'
              ? 'pause'
              : request.mediaParams?.action || 'toggle';

        this.setStatus('executing', `Media action: ${mediaAction}`);
        const mediaRes = await this.bridge.sendCommand('MEDIA_CONTROL', {
          action: mediaAction,
          seconds: request.mediaParams?.seconds,
        });

        this.setStatus('completed');
        return {
          success: mediaRes?.success ?? true,
          actionId: request.actionId,
          action: request.action,
          spokenFeedback: mediaRes?.message || `Executed ${mediaAction} on video.`,
          latencyMs: Date.now() - startTime,
        };
      }

      // 5. Typing / Search input
      if (request.action === 'TYPE_TEXT') {
        this.setStatus('executing', `Typing "${request.typeParams?.text}"`);
        const typeRes = await this.bridge.sendCommand('TYPE_TEXT', {
          text: request.typeParams?.text,
          pressEnter: request.typeParams?.pressEnter ?? true,
          clearFirst: request.typeParams?.clearFirst ?? true,
        });

        await new Promise((r) => setTimeout(r, 700)); // Wait for search results
        const afterState = await this.inspector.inspectCurrentPage().catch(() => null);
        const inspectSummary = afterState ? this.inspector.generateCompactSummary(afterState) : '';

        this.setStatus('completed');
        return {
          success: typeRes?.success ?? true,
          actionId: request.actionId,
          action: 'TYPE_TEXT',
          pageSummary: inspectSummary,
          spokenFeedback: `Searched for "${request.typeParams?.text}". The results are ready on the page.`,
          latencyMs: Date.now() - startTime,
        };
      }

      // 6. Click Element (Perception -> Resolution -> Execution -> Verification)
      if (request.action === 'CLICK_ELEMENT') {
        if (!request.target) {
          throw new Error('Target description is required to click an element.');
        }

        // Retry loop (max 2 attempts)
        let lastError = '';
        for (let attempt = 1; attempt <= 2; attempt++) {
          if (this.isCancelled) {
            return {
              success: false,
              actionId: request.actionId,
              action: 'CLICK_ELEMENT',
              error: { code: 'CANCELLED', message: 'Action cancelled by user.', recoverable: false },
            };
          }

          this.setStatus('inspecting', `Scanning page elements (attempt ${attempt})...`);
          const beforeState: PageState = await this.inspector.inspectCurrentPage();

          this.setStatus('resolving', `Matching "${request.target.description}"...`);
          const resolution = ElementResolver.resolve(request.target, beforeState.elements, this.targetMemory);

          if (resolution.isAmbiguous && resolution.alternativeMatches) {
            this.setStatus('idle');
            const opt1 = resolution.alternativeMatches[0]?.text;
            const opt2 = resolution.alternativeMatches[1]?.text;
            return {
              success: false,
              actionId: request.actionId,
              action: 'CLICK_ELEMENT',
              error: {
                code: 'AMBIGUOUS_TARGET',
                message: `Found multiple matching items: "${opt1}" or "${opt2}". Please clarify which one you mean.`,
                recoverable: true,
              },
              spokenFeedback: `Mujhe do similar results mil rahe hain: "${opt1?.substring(0, 30)}" ya "${opt2?.substring(0, 30)}". Aap kaunsi wali chahte hain?`,
            };
          }

          if (!resolution.bestMatch) {
            lastError = `Could not find an element matching "${request.target.description}".`;
            // Wait briefly before retry in case of dynamic lazy-loading
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }

          const target = resolution.bestMatch;
          this.targetMemory.recordTarget(target, 'click');

          this.setStatus('executing', `Clicking "${target.text || target.id}"`);
          const clickRes = await this.bridge.sendCommand('CLICK_ELEMENT', { elementId: target.id });

          if (!clickRes?.success) {
            lastError = clickRes?.error || 'Click failed';
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }

          // Allow DOM / SPA transition
          this.setStatus('verifying');
          await new Promise((r) => setTimeout(r, 600));

          const afterState = await this.inspector.inspectCurrentPage().catch(() => beforeState);
          const verification = ActionVerifier.verifyClick(beforeState, afterState, target);

          if (afterState.url !== beforeState.url) {
            this.targetMemory.notifyNavigation(afterState.url);
          }

          const summary = this.inspector.generateCompactSummary(afterState);

          this.setStatus('completed');
          return {
            success: true,
            actionId: request.actionId,
            action: 'CLICK_ELEMENT',
            target: {
              id: target.id,
              text: target.text,
              confidence: resolution.confidence,
            },
            verification,
            url: afterState.url,
            title: afterState.title,
            pageSummary: summary,
            spokenFeedback: `Opened "${target.text || 'item'}".`,
            latencyMs: Date.now() - startTime,
          };
        }

        throw new Error(lastError || 'Could not find or click target element.');
      }

      // 7. General Inspect Page
      if (request.action === 'INSPECT_PAGE' || request.action === 'GET_PAGE_STATE') {
        this.setStatus('inspecting');
        const pageState = await this.inspector.inspectCurrentPage();
        const summary = this.inspector.generateCompactSummary(pageState);

        this.setStatus('completed');
        return {
          success: true,
          actionId: request.actionId,
          action: 'INSPECT_PAGE',
          url: pageState.url,
          title: pageState.title,
          pageSummary: summary,
          spokenFeedback: `Currently on ${pageState.title || pageState.hostname}.`,
          latencyMs: Date.now() - startTime,
        };
      }

      throw new Error(`Unsupported browser action: ${request.action}`);
    } catch (err: any) {
      this.setStatus('failed', err.message);
      return {
        success: false,
        actionId: request.actionId,
        action: request.action,
        error: {
          code: 'EXECUTION_FAILED',
          message: err.message || String(err),
          recoverable: true,
        },
        spokenFeedback: `Action failed: ${err.message || 'Browser command could not be completed.'}`,
        latencyMs: Date.now() - startTime,
      };
    } finally {
      this.currentActionId = null;
    }
  }
}
