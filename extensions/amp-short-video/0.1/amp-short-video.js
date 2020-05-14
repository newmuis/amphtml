/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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

import {CSS} from '../../../build/amp-short-video-0.1.css';
import {Layout} from '../../../src/layout';
import {Services} from '../../../src/services';
import {htmlFor} from '../../../src/static-template';

/** @type {string} */
const TAG = 'amp-short-video';

/**
 * Generates the navigation education template.
 * @param {!Element} element
 * @return {!Element}
 */
const buildSystemLayer = element => {
  const html = htmlFor(element);
  return html`
    <nav>
      <span class="i-amphtml-short-video-ui-chrome">UI Chrome</span>
      <span class="i-amphtml-short-video-ui-chrome">UI Chrome</span>
      <span class="i-amphtml-short-video-ui-chrome">UI Chrome</span>
      <span class="i-amphtml-short-video-ui-chrome">UI Chrome</span>
    </nav>
  `;
};

const isReservedAttributeName = name => {
  return name.startsWith('i-amphtml') || ['class'].indexOf(name) >= 0;
};

export class AmpShortVideo extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private {?Element} */
    this.systemLayer_ = null;

    /** @private {?Element} */
    this.videoLayer_ = null;

    /** @private {boolean} */
    this.isVideoDelegatedToViewer_ = false;

    /** @private {?../../../src/service/viewer-interface.ViewerInterface} */
    this.viewer_ = null;

    /** @private {!Object} */
    this.attributes_ = {};
  }

  /** @override */
  buildCallback() {
    // Extra host to reset inherited styles and further enforce shadow DOM style
    // scoping using amp-story-shadow-reset.css.
    const hostEl = this.win.document.createElement('div');
    this.element.appendChild(hostEl);

    this.systemLayer_ = buildSystemLayer(this.element);
    this.systemLayer_.classList.add('i-amphtml-short-video-system-layer');
    hostEl.appendChild(this.systemLayer_);

    this.viewer_ = Services.viewerForDoc(this.element);
    this.pullAttributes_();

    Services.extensionsFor(this.win)
      .installExtensionForDoc(this.getAmpDoc(), 'amp-viewer-integration')
      .then(() => this.maybeHoistVideo_())
      .then(() => this.onVideoHoistSuccess_, () => this.onVideoHoistFailure_());
  }

  pullAttributes_() {
    for (let i = 0; i < this.element.attributes.length; i++) {
      const item = this.element.attributes.item(i);

      if (isReservedAttributeName(item.name)) {
        continue;
      }
      this.attributes_[item.name] = item.value;
    }
  }

  maybeHoistVideo_() {
    console.log('maybe hoist');
    if (!this.viewer_.hasCapability('hoist')) {
      console.log('viewer missing hoist capability');
      return Promise.reject();
    }

    console.log('attempting to hoist video');
    parent.postMessage({
      'message': 'hoistVideo',
      'data': this.attributes_,
    });
    return Promise.resolve();
  }

  onVideoHoistSuccess_() {
    console.log('hoist succeeded');
    this.isVideoDelegatedToViewer_ = true;
  }

  onVideoHoistFailure_() {
    console.log('hoist failed');
    // Create an amp-youtube element.

    // this.mutateElement(() => {
    //   this.videoLayer_ = this.win.document.createElement('amp-youtube');
    //   Object.keys(this.attributes_).forEach(attrName => {
    //     this.videoLayer_.setAttribute(attrName, this.attributes_[attrName]);
    //   });
    //   this.videoLayer_.setAttribute('autoplay', '');
    //   // this.videoLayer_.setAttribute('data-param-controls', '0');
    //   // this.videoLayer_.setAttribute('data-param-disablekb', '1');
    //   // this.videoLayer_.setAttribute('data-param-playsinline', '1');
    //   this.element.appendChild(this.videoLayer_);
    // });

    // Services.extensionsFor(this.win).installExtensionForDoc(
    //   this.getAmpDoc(),
    //   'amp-youtube'
    // );
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout === Layout.CONTAINER;
  }
}

AMP.extension('amp-short-video', '0.1', AMP => {
  AMP.registerElement('amp-short-video', AmpShortVideo, CSS);
});
