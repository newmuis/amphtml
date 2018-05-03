/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Action, StateProperty} from './amp-story-store-service';
import {CSS} from '../../../build/amp-story-info-dialog-0.1.css';
import {LocalizedStringId} from './localization';
import {Services} from '../../../src/services';
import {closest} from '../../../src/dom';
import {createShadowRootWithStyle} from './utils';
import {dev} from '../../../src/log';
import {getAmpdoc} from '../../../src/service';
import {htmlFor} from '../../../src/static-template';

/** @const {string} Class to toggle the info dialog. */
export const DIALOG_VISIBLE_CLASS = 'i-amphtml-story-info-dialog-visible';

/** @const {string} Class to toggle the info dialog link. */
const MOREINFO_VISIBLE_CLASS = 'i-amphtml-story-info-moreinfo-visible';

export class InfoDialog {
  /**
   * @param {!Window} win
   * @param {!Element} parentEl Element where to append the component
   */
  constructor(win, parentEl) {
    /** @private @const {!Window} */
    this.win_ = win;

    /** @private {?Element} */
    this.element_ = null;

    /** @private {?Element} */
    this.innerContainerEl_ = null;

    /** @private {boolean} */
    this.isBuilt_ = false;

    /** @private @const {!./localization.LocalizationService} */
    this.localizationService_ = Services.localizationServiceV01(this.win_);

    /** @private @const {!./amp-story-store-service.AmpStoryStoreService} */
    this.storeService_ = Services.storyStoreServiceV01(this.win_);

    /** @private @const {!Element} */
    this.parentEl_ = parentEl;

    /** @const @private {!../../../src/service/vsync-impl.Vsync} */
    this.vsync_ = Services.vsyncFor(this.win_);

    /** @private {?Element} */
    this.moreInfoLinkEl_ = null;
  }

  /**
   * Builds and appends the component in the story.
   */
  build() {
    if (this.isBuilt()) {
      return;
    }

    this.isBuilt_ = true;
    const root = this.win_.document.createElement('div');
    const html = htmlFor(this.parentEl_);
    this.element_ = html`
        <div class="i-amphtml-story-info-dialog i-amphtml-story-system-reset">
          <div class="i-amphtml-story-info-dialog-container">
            <h1 class="i-amphtml-story-info-heading"></h1>
            <a class="i-amphtml-story-info-link"></a>
            <a class="i-amphtml-story-info-moreinfo"></a>
          </div>
        </div>`;

    createShadowRootWithStyle(root, this.element_, CSS);
    this.initializeListeners_();

    this.vsync_.run({
      mutate: () => {
        this.innerContainerEl_ =
            this.element_
                .querySelector('.i-amphtml-story-info-dialog-container');
      },
      measure: () => {
        this.parentEl_.appendChild(root);
      },
    });

    const pageUrl = Services.documentInfoForDoc(
        getAmpdoc(this.parentEl_)).canonicalUrl;
    this.setHeading_();
    this.setPageLink_(pageUrl);
    this.requestMoreInfoLink_()
        .then(moreInfoUrl => this.setMoreInfoLinkUrl_(moreInfoUrl));
  }

  /**
   * Whether the element has been built.
   * @return {boolean}
   */
  isBuilt() {
    return this.isBuilt_;
  }

  /**
   * @private
   */
  initializeListeners_() {
    this.storeService_.subscribe(StateProperty.INFO_DIALOG_STATE, isOpen => {
      this.onInfoDialogStateUpdated_(isOpen);
    });

    this.element_.addEventListener(
        'click', event => this.onInfoDialogClick_(event));
  }

  /**
   * Reacts to menu state updates and decides whether to show either the native
   * system sharing, or the fallback UI.
   * @param {boolean} isOpen
   * @private
   */
  onInfoDialogStateUpdated_(isOpen) {
    this.vsync_.mutate(() => {
      this.element_.classList.toggle(DIALOG_VISIBLE_CLASS, isOpen);
    });
  }

  /**
   * Handles click events and maybe closes the dialog.
   * @param  {!Event} event
   */
  onInfoDialogClick_(event) {
    const el = dev().assertElement(event.target);
    // Closes the dialog if click happened outside of the dialog main container.
    if (!closest(el, el => el === this.innerContainerEl_, this.element_)) {
      this.close_();
    }
  }

  /**
   * Closes the info dialog.
   * @private
   */
  close_() {
    this.storeService_.dispatch(Action.TOGGLE_INFO_DIALOG, false);
  }

  /**
   * @return {!Promise<?string>} The URL to visit to receive more info on this
   *     page.
   * @private
   */
  requestMoreInfoLink_() {
    // TODO(newmuis): Ping the viewer to get the more info link.
    return Promise.resolve(null);
  }

  /**
   * Sets the heading on the dialog.
   */
  setHeading_() {
    const label = this.localizationService_.getLocalizedString(
        LocalizedStringId.AMP_STORY_DOMAIN_DIALOG_HEADING_LABEL);
    const headingEl = this.element_
        .querySelector('.i-amphtml-story-info-heading');
    headingEl.textContent = label;
  }

  /**
   * @param {string} pageUrl The URL to the canonical version of the current
   *     document.
   */
  setPageLink_(pageUrl) {
    const linkEl = this.element_.querySelector('.i-amphtml-story-info-link');
    linkEl.setAttribute('href', pageUrl);
    linkEl.setAttribute('rel', 'amphtml');

    // Add zero-width spaces after "." and "/" characters to help line-breaks
    // occur more naturally.
    linkEl.textContent = pageUrl.replace(/([/.]+)/gi, '$1\u200B');
  }

  /**
   * @param {?string} moreInfoUrl The URL to the "more info" page, if there is
   * one.
   */
  setMoreInfoLinkUrl_(moreInfoUrl) {
    if (!moreInfoUrl) {
      return;
    }

    this.vsync_.run({
      measure: () => {
        this.moreInfoLinkEl_ = this.element_
            .querySelector('.i-amphtml-story-info-moreinfo');
      },
      mutate: () => {
        const label = this.localizationService_.getLocalizedString(
            LocalizedStringId.AMP_STORY_DOMAIN_DIALOG_HEADING_LINK);
        this.moreInfoLinkEl_.classList.add(MOREINFO_VISIBLE_CLASS);
        this.moreInfoLinkEl_.setAttribute('href', moreInfoUrl);
        this.moreInfoLinkEl_.setAttribute('target', '_blank');
        this.moreInfoLinkEl_.textContent = label;
      },
    });
  }
}
