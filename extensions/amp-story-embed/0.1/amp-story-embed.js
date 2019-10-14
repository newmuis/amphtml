/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
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

import {AmpStoryEmbedManager} from '../../../src/amp-story-embed-manager';
import {Layout} from '../../../src/layout';

export class AmpStoryEmbed extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private {?AmpStoryEmbedManager} */
    this.embedManager_ = null;
  }

  /** @override */
  buildCallback() {
    this.embedManager_ = new AmpStoryEmbedManager(
      this.element.ownerDocument,
      this.element
    );

    this.embedManager_.build();
  }

  /** @override */
  layoutCallback() {
    return this.embedManager_.layout();
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.CONTAINER;
  }
}

AMP.extension('amp-story-embed', '0.1', AMP => {
  AMP.registerElement('amp-story-embed', AmpStoryEmbed);
});
