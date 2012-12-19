// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Atoms for simulating user actions against the DOM.
 * The bot.action namespace is required since these atoms would otherwise form a
 * circular dependency between bot.dom and bot.events.
 *
 */

goog.provide('bot.action');

goog.require('bot');
goog.require('bot.Device');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('bot.Keyboard');
goog.require('bot.Mouse');
goog.require('bot.Touchscreen');
goog.require('bot.dom');
goog.require('bot.events');
goog.require('bot.events.EventType');
goog.require('bot.locators');
goog.require('bot.userAgent');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('goog.dom.TagName');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Rect');
goog.require('goog.math.Vec2');
goog.require('goog.userAgent');


/**
 * Throws an exception if an element is not shown to the user, ignoring its
 * opacity.

 *
 * @param {!Element} element The element to check.
 * @see bot.dom.isShown.
 * @private
 */
bot.action.checkShown_ = function(element) {
  if (!bot.dom.isShown(element, /*ignoreOpacity=*/true)) {
    throw new bot.Error(bot.ErrorCode.ELEMENT_NOT_VISIBLE,
        'Element is not currently visible and may not be manipulated');
  }
};


/**
 * Throws an exception if the given element cannot be interacted with.
 *
 * @param {!Element} element The element to check.
 * @throws {bot.Error} If the element cannot be interacted with.
 * @see bot.dom.isInteractable.
 * @private
 */
bot.action.checkInteractable_ = function(element) {
  if (!bot.dom.isInteractable(element)) {
    throw new bot.Error(bot.ErrorCode.INVALID_ELEMENT_STATE,
        'Element is not currently interactable and may not be manipulated');

  }
};


/**
 * Clears the given {@code element} if it is a editable text field.
 *
 * @param {!Element} element The element to clear.
 * @throws {bot.Error} If the element is not an editable text field.
 */
bot.action.clear = function(element) {
  bot.action.checkInteractable_(element);
  if (!bot.dom.isEditable(element)) {
    throw new bot.Error(bot.ErrorCode.INVALID_ELEMENT_STATE,
        'Element must be user-editable in order to clear it.');
  }

  bot.action.LegacyDevice_.focusOnElement(element);
  if (element.value) {
    element.value = '';
    bot.events.fire(element, bot.events.EventType.CHANGE);
  }

  if (bot.dom.isContentEditable(element)) {
    // A single space is required, if you put empty string here you'll not be
    // able to interact with this element anymore in Firefox.
    element.innerHTML = ' ';
    // contentEditable does not generate onchange event.
  }
};


/**
 * Focuses on the given element if it is not already the active element.
 *
 * @param {!Element} element The element to focus on.
 */
bot.action.focusOnElement = function(element) {
  bot.action.checkInteractable_(element);
  bot.action.LegacyDevice_.focusOnElement(element);
};


/**
 * Types keys on the given {@code element} with a virtual keyboard.
 *
 * <p>Callers can pass in either strings or members of bot.Keyboard.Key. If a
 * modifier key is provided, it is pressed but not released, until it is either
 * is listed again or the function ends.
 *
 * <p>Example:
 *   bot.keys.type(element, 'ab', bot.Keyboard.Key.LEFT,
 *                 bot.Keyboard.Key.DELETE, bot.Keyboard.Key.SHIFT, 'cd');
 *
 * @param {!Element} element The element receiving the event.
 * @param {...(string|!bot.Keyboard.Key)} var_args Values to type on the
 *    element, either strings or members of bot.Keyboard.Key.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.type = function(element, var_args) {
  bot.action.checkShown_(element);
  bot.action.checkInteractable_(element);
  var keyboard = new bot.Keyboard();
  keyboard.moveCursor(element);

  var values = goog.array.slice(arguments, 1);
  goog.array.forEach(values, function(value) {
    if (goog.isString(value)) {
      goog.array.forEach(value.split(''), function(ch) {
        var keyShiftPair = bot.Keyboard.Key.fromChar(ch);
        if (keyShiftPair.shift) {
          keyboard.pressKey(bot.Keyboard.Keys.SHIFT);
        }
        keyboard.pressKey(keyShiftPair.key);
        keyboard.releaseKey(keyShiftPair.key);
        if (keyShiftPair.shift) {
          keyboard.releaseKey(bot.Keyboard.Keys.SHIFT);
        }
      });
    } else if (goog.array.contains(bot.Keyboard.MODIFIERS, value)) {
      if (keyboard.isPressed(value)) {
        keyboard.releaseKey(value);
      } else {
        keyboard.pressKey(value);
      }
    } else {
      keyboard.pressKey(value);
      keyboard.releaseKey(value);
    }
  });

  // Release all the modifier keys.
  goog.array.forEach(bot.Keyboard.MODIFIERS, function(key) {
    if (keyboard.isPressed(key)) {
      keyboard.releaseKey(key);
    }
  });
};


/**
 * Submits the form containing the given {@code element}.
 *
 * <p>Note this function submits the form, but does not simulate user input
 * (a click or key press).
 *
 * @param {!Element} element The element to submit.
 * @deprecated Click on a submit button or type ENTER in a text box instead.
 */
bot.action.submit = function(element) {
  var form = bot.action.LegacyDevice_.findAncestorForm(element);
  if (!form) {
    throw new bot.Error(bot.ErrorCode.INVALID_ELEMENT_STATE,
                        'Element was not in a form, so could not submit.');
  }
  bot.action.LegacyDevice_.submitForm(element, form);
};


/**
 * Moves the mouse over the given {@code element} with a virtual mouse.
 *
 * @param {!Element} element The element to click.
 * @param {goog.math.Coordinate=} opt_coords Mouse position relative to the
 *   element.
 * @param {bot.Mouse=} opt_mouse Mouse to use; if not provided, constructs one.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.moveMouse = function(element, opt_coords, opt_mouse) {
  bot.action.moveAndReturnMouse_(element, opt_coords, opt_mouse);
};


/**
 * Clicks on the given {@code element} with a virtual mouse.
 *
 * @param {!Element} element The element to click.
 * @param {goog.math.Coordinate=} opt_coords Mouse position relative to the
 *   element.
 * @param {bot.Mouse=} opt_mouse Mouse to use; if not provided, constructs one.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.click = function(element, opt_coords, opt_mouse) {
  var mouse = bot.action.moveAndReturnMouse_(element, opt_coords, opt_mouse);
  bot.action.pressAndReleaseButton_(mouse, element, bot.Mouse.Button.LEFT);
};


/**
 * Right-clicks on the given {@code element} with a virtual mouse.
 *
 * @param {!Element} element The element to click.
 * @param {goog.math.Coordinate=} opt_coords Mouse position relative to the
 *   element.
 * @param {bot.Mouse=} opt_mouse Mouse to use; if not provided, constructs one.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.rightClick = function(element, opt_coords, opt_mouse) {
  var mouse = bot.action.moveAndReturnMouse_(element, opt_coords, opt_mouse);
  bot.action.pressAndReleaseButton_(mouse, element, bot.Mouse.Button.RIGHT);
};


/**
 * Double-clicks on the given {@code element} with a virtual mouse.
 *
 * @param {!Element} element The element to click.
 * @param {goog.math.Coordinate=} opt_coords Mouse position relative to the
 *   element.
 * @param {bot.Mouse=} opt_mouse Mouse to use; if not provided, constructs one.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.doubleClick = function(element, opt_coords, opt_mouse) {
  var mouse = bot.action.moveAndReturnMouse_(element, opt_coords, opt_mouse);
  bot.action.pressAndReleaseButton_(mouse, element, bot.Mouse.Button.LEFT);
  bot.action.pressAndReleaseButton_(mouse, element, bot.Mouse.Button.LEFT);
};


/**
 * Scrolls the mouse wheel on the given {@code element} with a virtual mouse.
 *
 * @param {!Element} element The element to scroll the mouse wheel on.
 * @param {goog.math.Coordinate=} opt_coords Mouse position relative to the
 *   element.
 * @param {bot.Mouse=} opt_mouse Mouse to use; if not provided, constructs one.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.scrollMouse = function(element, ticks, opt_coords, opt_mouse) {
  var mouse = bot.action.moveAndReturnMouse_(element, opt_coords, opt_mouse);
  mouse.scroll(ticks);
};


/**
 * Drags the given {@code element} by (dx, dy) with a virtual mouse.
 *
 * @param {!Element} element The element to drag.
 * @param {number} dx Increment in x coordinate.
 * @param {number} dy Increment in y coordinate.
 * @param {goog.math.Coordinate=} opt_coords Drag start position relative to the
 *   element.
 * @param {bot.Mouse=} opt_mouse Mouse to use; if not provided, constructs one.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.drag = function(element, dx, dy, opt_coords, opt_mouse) {
  var mouse = bot.action.moveAndReturnMouse_(element, opt_coords);
  mouse.pressButton(bot.Mouse.Button.LEFT);

  // Fire two mousemoves (middle and destination) to trigger a drag action.
  var initPos = goog.style.getClientPosition(element);
  var midXY = new goog.math.Coordinate(opt_coords.x + Math.floor(dx / 2),
                                       opt_coords.y + Math.floor(dy / 2));
  mouse.move(element, midXY);

  var midPos = goog.style.getClientPosition(element);
  var finalXY = new goog.math.Coordinate(
      initPos.x + opt_coords.x + dx - midPos.x,
      initPos.y + opt_coords.y + dy - midPos.y);
  mouse.move(element, finalXY);

  mouse.releaseButton();
};


/**
 * A helper function which prepares a virtual mouse for an action on the given
 * {@code element}. It checks if the the element is shown, scrolls the element
 * into view, and moves the mouse to the given {@code opt_coords} if provided;
 * if not provided, the mouse is moved to the center of the element.
 *
 * @param {!Element} element The element to click.
 * @param {goog.math.Coordinate=} opt_coords Mouse position relative to the
 *   target.
 * @param {bot.Mouse=} opt_mouse Mouse to use; if not provided, constructs one.
 * @return {!bot.Mouse} The mouse object used for the click.
 * @throws {bot.Error} If the element cannot be interacted with.
 * @private
 */
bot.action.moveAndReturnMouse_ = function(element, opt_coords, opt_mouse) {
  bot.action.checkShown_(element);

  // Unlike element.scrollIntoView(), this scrolls the minimal amount
  // necessary, not scrolling at all if the element is already in view.
  var doc = goog.dom.getOwnerDocument(element);
  goog.style.scrollIntoContainerView(element,
      goog.userAgent.WEBKIT ? doc.body : doc.documentElement);

  // NOTE(user): Ideally, we would check that any provided coordinates fall
  // within the bounds of the element, but this has proven difficult, because:
  // (1) Browsers sometimes lie about the true size of elements, e.g. when text
  // overflows the bounding box of an element, browsers report the size of the
  // box even though the true area that can be interacted with is larger; and
  // (2) Elements with children styled as position:absolute will often not have
  // a bounding box that surrounds all of their children, but it is useful for
  // the user to be able to interact with this parent element as if it does.
  if (!opt_coords) {
    var size = goog.style.getSize(element);
    opt_coords = new goog.math.Coordinate(size.width / 2, size.height / 2);
  }

  var mouse = opt_mouse || new bot.Mouse();
  mouse.move(element, opt_coords);
  return mouse;
};


/**
 * A helper function which triggers a mouse press and mouse release.
 *
 * @param {!bot.Mouse} mouse The object which is used to trigger the mouse
 * events.
 * @param {!Element} element The element to click.
 * @param {!bot.Mouse.Button} button The mouse button.
 * {@code element}.
 * @private
 */
bot.action.pressAndReleaseButton_ = function(mouse, element, button) {
  mouse.pressButton(button);
  mouse.releaseButton();
};


/**
 * Taps on the given {@code element} with a virtual touch screen.
 *
 * @param {!Element} element The element to tap.
 * @param {goog.math.Coordinate=} opt_coords Finger position relative to the
 *   target.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.tap = function(element, opt_coords) {
  bot.action.checkShown_(element);

  var touchScreen = new bot.Touchscreen();
  if (!opt_coords) {
    var size = goog.style.getSize(element);
    opt_coords = new goog.math.Coordinate(size.width / 2, size.height / 2);
  }
  touchScreen.move(element, opt_coords);
  touchScreen.press();
  touchScreen.release();
};


/**
 * Swipes the given {@code element} by (dx, dy) with a virtual touch screen.
 *
 * @param {!Element} element The element to swipe.
 * @param {number} dx Increment in x coordinate.
 * @param {number} dy Increment in y coordinate.
 * @param {goog.math.Coordinate=} opt_coords swipe start position relative to
 *   the element.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.swipe = function(element, dx, dy, opt_coords) {
  bot.action.checkInteractable_(element);

  var touchScreen = new bot.Touchscreen();
  if (!opt_coords) {
    var size = goog.style.getSize(element);
    opt_coords = new goog.math.Coordinate(size.width / 2, size.height / 2);
  }
  touchScreen.move(element, opt_coords);
  touchScreen.press();

  // Fire two touchmoves (middle and destination) to trigger a drag action.
  var initPos = goog.style.getClientPosition(element);
  var midXY = new goog.math.Coordinate(opt_coords.x + Math.floor(dx / 2),
                                       opt_coords.y + Math.floor(dy / 2));
  touchScreen.move(element, midXY);

  var midPos = goog.style.getClientPosition(element);
  var finalXY = new goog.math.Coordinate(
      initPos.x + opt_coords.x + dx - midPos.x,
      initPos.y + opt_coords.y + dy - midPos.y);
  touchScreen.move(element, finalXY);

  touchScreen.release();
};


/**
 * Helper function that has common logic needing for the pinch and zoom actions.
 *
 * @param {!Element} element The element to scale.
 * @param {boolean} isZoom Whether or not to zoom.
 * @private
 */
bot.action.scale_ = function(element, isZoom) {
  bot.action.checkInteractable_(element);
  var size = goog.style.getSize(element);
  var center = new goog.math.Vec2(size.width / 2, size.height / 2);
  // To choose the default coordinate, we imagine a circle centered on the
  // element's center. The first finger coordinate is the top of this circle
  // i.e. the 12 o'clock mark and the second finger is at 6 o'clock.
  var outer1 = new goog.math.Coordinate(size.width / 2, 0);
  var outer2 = new goog.math.Coordinate(size.width / 2, size.height);
  var mid1 = new goog.math.Coordinate(size.width / 2, size.height);
  var mid2 = new goog.math.Coordinate(size.width / 2, 3 * size.height / 4);

  // For zoom, start from the center and go outwards and vice versa for pinch.
  var start1 = isZoom ? center : outer1;
  var start2 = isZoom ? center : outer2;
  var end1 = isZoom ? outer1 : center;
  var end2 = isZoom ? outer2 : center;

  var touchScreen = new bot.Touchscreen();
  touchScreen.move(element, start1, start2);
  touchScreen.press(/*Two Finger Press*/ true);
  touchScreen.move(element, mid1, mid2);
  touchScreen.move(element, end1, end2);
  touchScreen.release();
};


/**
 * Pinches the given {@code element} (moves fingers inward to its center) with a
 * virtual touch screen.
 *
 * @param {!Element} element The element to pinch.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.pinch = function(element) {
  bot.action.scale_(element, /* isZoom */ false);
};


/**
 * Zooms the given {@code element} (moves fingers outward to its edge) with a
 * virtual touch screen.
 *
 * @param {!Element} element The element to zoom.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.zoom = function(element) {
  bot.action.scale_(element, /* isZoom */ true);
};


/**
 * Rotates the given {@code element} (moves fingers along a circular arc) with a
 * virtual touch screen by the given rotation {@code angle}.
 *
 * @param {!Element} element The element to rotate.
 * @param {number} angle The degrees of rotation between -180 and 180.  A
 *   positve number indicates a clockwise rotation.
 * @throws {bot.Error} If the element cannot be interacted with.
 */
bot.action.rotate = function(element, angle) {
  bot.action.checkInteractable_(element);
  var size = goog.style.getSize(element);
  var center = new goog.math.Vec2(size.width / 2, size.height / 2);
  // To choose the default coordinate, we imagine a circle centered on the
  // element's center. The first finger coordinate is the top of this circle
  // i.e. the 12 o'clock mark and the second finger is at 6 o'clock.
  var coords1 = new goog.math.Vec2(size.width / 2, 0);
  var coords2 = new goog.math.Vec2(size.width / 2, size.height);

  // Convert the degrees to radians.
  var halfRadians = Math.PI * (angle / 180) / 2;

  var touchScreen = new bot.Touchscreen();
  touchScreen.move(element, coords1, coords2);
  touchScreen.press(/*Two Finger Press*/ true);

  // Complete the rotation in two steps.
  var mid1 = goog.math.Vec2.rotateAroundPoint(coords1, center, halfRadians);
  var mid2 = goog.math.Vec2.rotateAroundPoint(coords2, center, halfRadians);
  touchScreen.move(element, mid1, mid2);

  var end1 = goog.math.Vec2.rotateAroundPoint(mid1, center, halfRadians);
  var end2 = goog.math.Vec2.rotateAroundPoint(mid2, center, halfRadians);
  touchScreen.move(element, end1, end2);

  touchScreen.release();
};



/**
 * A Device that is intended to allows access to protected members of the
 * Device superclass. A singleton.
 *
 * @constructor
 * @extends {bot.Device}
 * @private
 */
bot.action.LegacyDevice_ = function() {
  goog.base(this);
};
goog.inherits(bot.action.LegacyDevice_, bot.Device);
goog.addSingletonGetter(bot.action.LegacyDevice_);


/**
 * Focuses on the given element.  See {@link bot.device.focusOnElement}.
 * @param {!Element} element The element to focus on.
 * @return {boolean} True if element.focus() was called on the element.
 */
bot.action.LegacyDevice_.focusOnElement = function(element) {
  var instance = bot.action.LegacyDevice_.getInstance();
  instance.setElement(element);
  return instance.focusOnElement();
};


/**
 * Submit the form for the element.  See {@link bot.device.submit}.
 * @param {!Element} element The element to submit a form on.
 * @param {!Element} form The form to submit.
 */
bot.action.LegacyDevice_.submitForm = function(element, form) {
  var instance = bot.action.LegacyDevice_.getInstance();
  instance.setElement(element);
  instance.submitForm(form);
};


/**
 * Find FORM element that is an ancestor of the passed in element.  See
 * {@link bot.device.findAncestorForm}.
 * @param {!Element} element The element to find an ancestor form.
 * @return {Element} form The ancestor form, or null if none.
 */
bot.action.LegacyDevice_.findAncestorForm = function(element) {
  return bot.Device.findAncestorForm(element);
};


/**
 * Scrolls the given {@code element} in to the current viewport. Aims to do the
 * minimum scrolling necessary, but prefers too much scrolling to too little.
 *
 * @param {!Element} element The element to scroll in to view.
 * @param {!goog.math.Coordinate=} opt_coords Offset relative to the top-left
 *     corner of the element, to ensure is scrolled in to view.
 * @return {boolean} Whether the element is in view after scrolling.
 */
bot.action.scrollIntoView = function(element, opt_coords) {
  if (!bot.dom.isScrolledIntoView(element, opt_coords)) {
    element.scrollIntoView();
    // In Opera 10, scrollIntoView only scrolls the element into the viewport of
    // its immediate parent window, so we explicitly scroll the ancestor frames
    // into view of their respective windows. Note that scrolling the top frame
    // first --- and so on down to the element itself --- does not work, because
    // Opera 10 apparently treats element.scrollIntoView() as a noop when it
    // immediately follows a scrollIntoView() call on its parent frame.
    if (goog.userAgent.OPERA && !bot.userAgent.isEngineVersion(11)) {
      var win = goog.dom.getWindow(goog.dom.getOwnerDocument(element));
      for (var frame = win.frameElement; frame; frame = win.frameElement) {
        frame.scrollIntoView();
        win = goog.dom.getWindow(goog.dom.getOwnerDocument(frame));
      }
    }
  }
  if (opt_coords) {
    var rect = new goog.math.Rect(opt_coords.x, opt_coords.y, 1, 1);
    bot.dom.scrollElementRegionIntoClientView(element, rect);
  }
  var isInView = bot.dom.isScrolledIntoView(element, opt_coords);
  if (!isInView && opt_coords) {
    // It's possible that the element has been scrolled in to view, but the
    // coords passed aren't in view; if this is the case, scroll those
    // coordinates into view.
    var elementCoordsInViewport = goog.style.getClientPosition(element);
    var desiredPointInViewport =
        goog.math.Coordinate.sum(elementCoordsInViewport, opt_coords);
    try {
      bot.dom.getInViewLocation(
          desiredPointInViewport,
          goog.dom.getWindow(goog.dom.getOwnerDocument(element)));
      isInView = true;
    } catch (ex) {
      // Point couldn't be scrolled into view.
      isInView = false;
    }
  }

  return isInView;
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Overall configuration of the browser automation atoms.
 */


goog.provide('bot');


goog.require('goog.userAgent');


/**
 * Frameworks using the atoms keep track of which window or frame is currently
 * being used for command execution. Note that "window" may not always be
 * defined (for example in firefox extensions)
 *
 * @type {!Window}
 * @private
 */
try {
  bot.window_ = window;
} catch (ignored) {
  // We only reach this place in a firefox extension.
  bot.window_ = goog.global;
}


/**
 * Returns the window currently being used for command execution.
 *
 * @return {!Window} The window for command execution.
 */
bot.getWindow = function() {
  return bot.window_;
};


/**
 * Sets the window to be used for command execution.
 *
 * @param {!Window} win The window for command execution.
 */
bot.setWindow = function(win) {
  bot.window_ = win;
};


/**
 * Returns the document of the window currently being used for
 * command execution.
 *
 * @return {!Document} The current window's document.
 */
bot.getDocument = function() {
  return bot.window_.document;
};
// Copyright 2011 WebDriver committers
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview The file contains the base class for input devices such as
 * the keyboard, mouse, and touchscreen.
 */

goog.provide('bot.Device');

goog.require('bot');
goog.require('bot.dom');
goog.require('bot.userAgent');



/**
 * A Device class that provides common functionality for input devices.
 *
 * @constructor
 */
bot.Device = function() {
  /**
   * Element being interacted with.
   * @type {!Element}
   * @private
   */
  this.element_ = bot.getDocument().documentElement;

  /**
   * If the element is an option, this is its parent select element.
   * @type {Element}
   * @private
   */
  this.select_ = null;

  // If there is an active element, make that the current element instead.
  var activeElement = bot.dom.getActiveElement(this.element_);
  if (activeElement) {
    this.setElement(activeElement);
  }
};


/**
 * Returns the element with which the device is interacting.
 *
 * @return {!Element} Element being interacted with.
 * @protected
 */
bot.Device.prototype.getElement = function() {
  return this.element_;
};


/**
 * Sets the element with which the device is interacting.
 *
 * @param {!Element} element Element being interacted with.
 * @protected
 */
bot.Device.prototype.setElement = function(element) {
  this.element_ = element;
  if (bot.dom.isElement(element, goog.dom.TagName.OPTION)) {
    this.select_ = /** @type {Element} */ (goog.dom.getAncestor(element,
        function(node) {
          return bot.dom.isElement(node, goog.dom.TagName.SELECT);
        }));
  } else {
    this.select_ = null;
  }
};


/**
 * Fires an HTML event given the state of the device.
 *
 * @param {bot.events.EventType} type HTML Event type.
 * @return {boolean} Whether the event fired successfully; false if cancelled.
 * @protected
 */
bot.Device.prototype.fireHtmlEvent = function(type) {
  return bot.events.fire(this.element_, type);
};


/**
 * Fires a keyboard event given the state of the device and the given arguments.
 * TODO(user): Populate the modifier keys in this method.
 *
 * @param {bot.events.EventType} type Keyboard event type.
 * @param {bot.events.KeyboardArgs} args Keyboard event arguments.
 * @return {boolean} Whether the event fired successfully; false if cancelled.
 * @protected
 */
bot.Device.prototype.fireKeyboardEvent = function(type, args) {
  return bot.events.fire(this.element_, type, args);
};


/**
 * Fires a mouse event given the state of the device and the given arguments.
 * TODO(user): Populate the modifier keys in this method.
 *
 * @param {bot.events.EventType} type Mouse event type.
 * @param {!goog.math.Coordinate} coord The coordinate where event will fire.
 * @param {number} button The mouse button value for the event.
 * @param {Element=} opt_related The related element of this event.
 * @param {number=} opt_wheelDelta The wheel delta value for the event.
 * @return {boolean} Whether the event fired successfully; false if cancelled.
 * @protected
 */
bot.Device.prototype.fireMouseEvent = function(type, coord, button,
                                               opt_related, opt_wheelDelta) {
  // TODO(user): Event if the element is not interactable, the mouse event
  // should still fire on another element (offset parent?).
  if (!bot.dom.isInteractable(this.element_)) {
    return false;
  }

  if (opt_related &&
      !(bot.events.EventType.MOUSEOVER == type ||
        bot.events.EventType.MOUSEOUT == type)) {
    throw new bot.Error(bot.ErrorCode.INVALID_ELEMENT_STATE,
                        'Event type does not allow related target: ' + type);
  }

  var args = {
    clientX: coord.x,
    clientY: coord.y,
    button: button,
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    wheelDelta: opt_wheelDelta || 0,
    relatedTarget: opt_related || null
  };

  var target = this.select_ ?
      this.getTargetOfOptionMouseEvent_(type) : this.element_;
  return target ? bot.events.fire(target, type, args) : true;
};


/**
 * Fires a touch event given the state of the deive and the given arguments.
 *
 * @param {bot.events.EventType} type Event type.
 * @param {number} id The touch identifier.
 * @param {!goog.math.Coordinate} coord The coordinate where event will fire.
 * @param {number=} opt_id2 The touch identifier of the second finger.
 * @param {!goog.math.Coordinate=} opt_coord2 The coordinate of the second
 *    finger, if any.
 * @return {boolean} Whether the event fired successfully or was cancelled.
 * @protected
 */
bot.Device.prototype.fireTouchEvent = function(type, id, coord, opt_id2,
                                               opt_coord2) {
  var args = {
    touches: [],
    targetTouches: [],
    changedTouches: [],
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    relatedTarget: null,
    scale: 0,
    rotation: 0
  };

  function addTouch(identifier, coords) {
    // Android devices leave identifier to zero.
    var id = goog.userAgent.product.ANDROID ? 0 : identifier;
    var touch = {
      identifier: identifier,
      screenX: coords.x,
      screenY: coords.y,
      clientX: coords.x,
      clientY: coords.y,
      pageX: coords.x,
      pageY: coords.y
    };

    args.changedTouches.push(touch);
    if (type == bot.events.EventType.TOUCHSTART ||
        type == bot.events.EventType.TOUCHMOVE) {
      args.touches.push(touch);
      args.targetTouches.push(touch);
    }
  }

  addTouch(id, coord);
  if (goog.isDef(opt_id2)) {
    addTouch(opt_id2, opt_coord2);
  }

  return bot.events.fire(this.element_, type, args);
};


/**
 * A mouse event fired "on" an <option> element, doesn't always fire on the
 * <option> element itself. Sometimes it fires on the parent <select> element
 * and sometimes not at all, depending on the browser and event type. This
 * returns the true target element of the event, or null if none is fired.
 *
 * @param {bot.events.EventType} type Type of event.
 * @return {Element} Element the event should be fired on, null if none.
 * @private
 */
bot.Device.prototype.getTargetOfOptionMouseEvent_ = function(type) {
  // IE either fires the event on the parent select or not at all.
  if (goog.userAgent.IE) {
    switch (type) {
      case bot.events.EventType.MOUSEOVER:
        return null;
      case bot.events.EventType.CONTEXTMENU:
      case bot.events.EventType.MOUSEMOVE:
        return this.select_.multiple ? this.select_ : null;
      default:
        return this.select_;
    }
  }

  // Opera only skips mouseovers and contextmenus on single selects.
  if (goog.userAgent.OPERA) {
    switch (type) {
      case bot.events.EventType.CONTEXTMENU:
      case bot.events.EventType.MOUSEOVER:
        return this.select_.multiple ? this.element_ : null;
      default:
        return this.element_;
    }
  }

  // WebKit always fires on the option element of multi-selects.
  // On single-selects, it either fires on the parent or not at all.
  if (goog.userAgent.WEBKIT) {
    switch (type) {
      case bot.events.EventType.CLICK:
      case bot.events.EventType.MOUSEUP:
        return this.select_.multiple ? this.element_ : this.select_;
      default:
        return this.select_.multiple ? this.element_ : null;
    }
  }

  // Firefox fires every event or the option element.
  return this.element_;
};


/**
 * A helper function to fire click events.  This method is shared between
 * the mouse and touchscreen devices.
 *
 * @param {!goog.math.Coordinate} coord The coordinate where event will fire.
 * @param {number} button The mouse button value for the event.
 * @protected
 */
bot.Device.prototype.clickElement = function(coord, button) {
  if (!bot.dom.isInteractable(this.element_)) {
    return;
  }

  // bot.events.fire(element, 'click') can trigger all onclick events, but may
  // not follow links (FORM.action or A.href).
  //     TAG      IE   GECKO  WebKit Opera
  // A(href)      No    No     Yes    Yes
  // FORM(action) No    Yes    Yes    Yes
  var targetLink = null;
  var targetButton = null;
  if (bot.Device.EXPLICIT_FOLLOW_LINK_) {
    for (var e = this.element_; e; e = e.parentNode) {
      if (bot.dom.isElement(e, goog.dom.TagName.A)) {
        targetLink = /**@type {!Element}*/ (e);
        break;
      } else if (bot.Device.isFormSubmitElement(e)) {
        targetButton = e;
        break;
      }
    }
  }

  var selectable = bot.dom.isSelectable(this.element_);
  var wasSelected = selectable && bot.dom.isSelected(this.element_);

  // When an element is toggled as the result of a click, the toggling and the
  // change event happens before the click event. However, on radio buttons and
  // checkboxes, the click handler can prevent the toggle from happening, so
  // for those we need to fire a click before toggling to see if the click was
  // cancelled. For option elements, we toggle unconditionally before the click.
  if (this.select_) {
    this.toggleOption_(wasSelected);
  }

  // NOTE(user): Clicking on a form submit button is a little broken:
  // (1) When clicking a form submit button in IE, firing a click event or
  // calling Form.submit() will not by itself submit the form, so we call
  // Element.click() explicitly, but as a result, the coordinates of the click
  // event are not provided. Also, when clicking on an <input type=image>, the
  // coordinates click that are submitted with the form are always (0, 0).
  // (2) When clicking a form submit button in GECKO, while the coordinates of
  // the click event are correct, those submitted with the form are always (0,0)
  // .
  // TODO(user): See if either of these can be resolved, perhaps by adding
  // hidden form elements with the coordinates before the form is submitted.
  if (goog.userAgent.IE && targetButton) {
    targetButton.click();
    return;
  }

  var performDefault = this.fireMouseEvent(
      bot.events.EventType.CLICK, coord, button);
  if (!performDefault) {
    return;
  }

  if (targetLink && bot.Device.shouldFollowHref_(targetLink)) {
    bot.Device.followHref_(targetLink);
  } else if (selectable && !this.select_) {
    this.toggleRadioButtonOrCheckbox_(wasSelected);
  }
};


/**
 * Focuses on the given element and returns true if it supports being focused
 * and does not already have focus; otherwise, returns false. If another element
 * has focus, that element will be blurred before focusing on the given element.
 *
 * @return {boolean} Whether the element was given focus.
 * @protected
 */
bot.Device.prototype.focusOnElement = function() {
  // Focusing on an <option> always focuses on the parent <select>.
  var elementToFocus = this.select_ || this.element_;

  var activeElement = bot.dom.getActiveElement(elementToFocus);
  if (elementToFocus == activeElement) {
    return false;
  }

  // If there is a currently active element, try to blur it.
  if (activeElement && (goog.isFunction(activeElement.blur) ||
      // IE reports native functions as being objects.
      goog.userAgent.IE && goog.isObject(activeElement.blur))) {
    // In IE, the focus() and blur() functions fire their respective events
    // asynchronously, and as the result, the focus/blur events fired by the
    // the atoms actions will often be in the wrong order on IE. Firing a blur
    // out of order sometimes causes IE to throw an "Unspecified error", so we
    // wrap it in a try-catch and catch and ignore the error in this case.
    try {
      activeElement.blur();
    } catch (e) {
      if (!(goog.userAgent.IE && e.message == 'Unspecified error.')) {
        throw e;
      }
    }

    // Sometimes IE6 and IE7 will not fire an onblur event after blur()
    // is called, unless window.focus() is called immediately afterward.
    // Note that IE8 will hit this branch unless the page is forced into
    // IE8-strict mode. This shouldn't hurt anything, we just use the
    // useragent sniff so we can compile this out for proper browsers.
    if (goog.userAgent.IE && !bot.userAgent.isEngineVersion(8)) {
      goog.dom.getWindow(goog.dom.getOwnerDocument(elementToFocus)).focus();
    }
  }

  // Try to focus on the element.
  if (goog.isFunction(elementToFocus.focus) ||
      goog.userAgent.IE && goog.isObject(elementToFocus.focus)) {
    // Opera fires focus events on hidden elements (e.g. that are hidden after
    // mousedown in a click sequence), but as of Opera 11 the focus() command
    // does not, so we fire a focus event on the hidden element explicitly.
    if (goog.userAgent.OPERA && bot.userAgent.isEngineVersion(11) &&
        !bot.dom.isShown(elementToFocus)) {
      bot.events.fire(elementToFocus, bot.events.EventType.FOCUS);
    } else {
      elementToFocus.focus();
    }
    return true;
  }

  return false;
};


/**
 * Whether extra handling needs to be considered when clicking on a link or a
 * submit button.
 *
 * @type {boolean}
 * @private
 * @const
 */
bot.Device.EXPLICIT_FOLLOW_LINK_ = goog.userAgent.IE ||
    // Normal firefox
    (goog.userAgent.GECKO && !bot.userAgent.FIREFOX_EXTENSION) ||
    // Firefox extension prior to Firefox 4
    (bot.userAgent.FIREFOX_EXTENSION && !bot.userAgent.isProductVersion(4));


/**
 * Whether synthesized events are trusted to trigger click actions.
 *
 * @type {boolean}
 * @private
 * @const
 */
bot.Device.CAN_SYNTHESISED_EVENTS_FOLLOW_LINKS_ =
    bot.userAgent.FIREFOX_EXTENSION && bot.userAgent.isProductVersion(4);


/**
 * Whether synthesized events can cause new windows to open.
 *
 * @type {boolean}
 * @const
 * @private
 */
bot.Device.SYNTHESISED_EVENTS_CAN_OPEN_JAVASCRIPT_WINDOWS_ =
    bot.userAgent.FIREFOX_EXTENSION;


/**
 * @param {Node} element The element to check.
 * @return {boolean} Whether the element is a submit element in form.
 * @protected
 */
bot.Device.isFormSubmitElement = function(element) {
  if (bot.dom.isElement(element, goog.dom.TagName.INPUT)) {
    var type = element.type.toLowerCase();
    if (type == 'submit' || type == 'image') {
      return true;
    }
  }

  if (bot.dom.isElement(element, goog.dom.TagName.BUTTON)) {
    var type = element.type.toLowerCase();
    if (type == 'submit') {
      return true;
    }
  }
  return false;
};


/**
 * Indicates whether we should manually follow the href of the element we're
 * clicking.
 *
 * Versions of firefox from 4+ will handle links properly when this is used in
 * an extension. Versions of Firefox prior to this may or may not do the right
 * thing depending on whether a target window is opened and whether the click
 * has caused a change in just the hash part of the URL.
 *
 * @param {!Element} element The element to consider.
 * @return {boolean} Whether following an href should be skipped.
 * @private
 */
bot.Device.shouldFollowHref_ = function(element) {
  if (!element.href) {
    return false;
  }

  if (goog.userAgent.IE ||
      (goog.userAgent.GECKO && !bot.userAgent.FIREFOX_EXTENSION)) {
    return true;
  }

  if (bot.Device.CAN_SYNTHESISED_EVENTS_FOLLOW_LINKS_) {
    return false;
  }

  if (element.target || element.href.toLowerCase().indexOf('javascript') == 0) {
    return !bot.Device.SYNTHESISED_EVENTS_CAN_OPEN_JAVASCRIPT_WINDOWS_;
  }

  var owner = goog.dom.getWindow(goog.dom.getOwnerDocument(element));
  var sourceUrl = owner.location.href;
  var destinationUrl = bot.Device.resolveUrl_(owner.location, element.href);
  var isOnlyHashChange =
      sourceUrl.split('#')[0] === destinationUrl.split('#')[0];

  return !isOnlyHashChange;
};


/**
 * Explicitly follows the href of an anchor.
 *
 * @param {!Element} anchorElement An anchor element.
 * @private
 */
bot.Device.followHref_ = function(anchorElement) {
  var targetHref = anchorElement.href;
  var owner = goog.dom.getWindow(goog.dom.getOwnerDocument(anchorElement));

  // IE7 and earlier incorrect resolve a relative href against the top window
  // location instead of the window to which the href is assigned. As a result,
  // we have to resolve the relative URL ourselves. We do not use Closure's
  // goog.Uri to resolve, because it incorrectly fails to support empty but
  // undefined query and fragment components and re-encodes the given url.
  if (goog.userAgent.IE && !bot.userAgent.isEngineVersion(8)) {
    targetHref = bot.Device.resolveUrl_(owner.location, targetHref);
  }

  if (anchorElement.target) {
    owner.open(targetHref, anchorElement.target);
  } else {
    owner.location.href = targetHref;
  }
};


/**
 * Toggles the selected state of an option element. This is a noop if the option
 * is selected and belongs to a single-select, because it can't be toggled off.
 *
 * @param {boolean} wasSelected Whether the element was originally selected.
 * @private
 */
bot.Device.prototype.toggleOption_ = function(wasSelected) {
  var select = /** @type {!Element} */ (this.select_);
  // Cannot toggle off options in single-selects.
  if (wasSelected && !select.multiple) {
    return;
  }
  this.element_.selected = !wasSelected;
  // Only WebKit fires the change event itself and only for multi-selects.
  if (!(goog.userAgent.WEBKIT && select.multiple)) {
    bot.events.fire(select, bot.events.EventType.CHANGE);
  }
};


/**
 * Toggles the selected state of a radio button or checkbox. This is a noop if
 * it is a radio button that is selected, because it can't be toggled off.
 *
 * @param {boolean} wasSelected Whether the element was originally selected.
 * @private
 */
bot.Device.prototype.toggleRadioButtonOrCheckbox_ = function(wasSelected) {
  // Gecko and WebKit toggle the element as a result of a click.
  if (goog.userAgent.GECKO || goog.userAgent.WEBKIT) {
    return;
  }
  // Cannot toggle off radio buttons.
  if (wasSelected && this.element_.type.toLowerCase() == 'radio') {
    return;
  }
  this.element_.checked = !wasSelected;
  // Only Opera versions < 11 do not fire the change event themselves.
  if (goog.userAgent.OPERA && !bot.userAgent.isEngineVersion(11)) {
    bot.events.fire(this.element_, bot.events.EventType.CHANGE);
  }
};


/**
 * Find FORM element that is an ancestor of the passed in element.
 * @param {Node} node The node to find a FORM for.
 * @return {Element} The ancestor FORM element if it exists.
 * @protected
 */
bot.Device.findAncestorForm = function(node) {
  return (/** @type {Element} */ goog.dom.getAncestor(
      node, bot.Device.isForm_, /*includeNode=*/true));
};


/**
 * @param {Node} node The node to test.
 * @return {boolean} Whether the node is a FORM element.
 * @private
 */
bot.Device.isForm_ = function(node) {
  return bot.dom.isElement(node, goog.dom.TagName.FORM);
};


/**
 * Submits the specified form. Unlike the public function, it expects to be
 * given a <form> element and fails if it is not.
 * @param {!Element} form The form to submit.
 * @protected
 */
bot.Device.prototype.submitForm = function(form) {
  if (!bot.Device.isForm_(form)) {
    throw new bot.Error(bot.ErrorCode.INVALID_ELEMENT_STATE,
                        'Element was not in a form, so could not submit.');
  }
  if (bot.events.fire(form, bot.events.EventType.SUBMIT)) {
    // When a form has an element with an id or name exactly equal to "submit"
    // (not uncommon) it masks the form.submit function. We  can avoid this by
    // calling the prototype's submit function, except in IE < 8, where DOM id
    // elements don't let you reference their prototypes. For IE < 8, can change
    // the id and names of the elements and revert them back, but they must be
    // reverted before the submit call, because the onsubmit handler might rely
    // on their being correct, and the HTTP request might otherwise be left with
    // incorrect value names. Fortunately, saving the submit function and
    // calling it after reverting the ids and names works! Oh, and goog.typeOf
    // (and thus goog.isFunction) doesn't work for form.submit in IE < 8.
    if (!bot.dom.isElement(form.submit)) {
      form.submit();
    } else if (!goog.userAgent.IE || bot.userAgent.isEngineVersion(8)) {
      (/** @type {Function} */ form.constructor.prototype.submit).call(form);
    } else {
      var idMasks = bot.locators.findElements({'id': 'submit'}, form);
      var nameMasks = bot.locators.findElements({'name': 'submit'}, form);
      goog.array.forEach(idMasks, function(m) {
        m.removeAttribute('id');
      });
      goog.array.forEach(nameMasks, function(m) {
        m.removeAttribute('name');
      });
      var submitFunction = form.submit;
      goog.array.forEach(idMasks, function(m) {
        m.setAttribute('id', 'submit');
      });
      goog.array.forEach(nameMasks, function(m) {
        m.setAttribute('name', 'submit');
      });
      submitFunction();
    }
  }
};


/**
 * Regular expression for splitting up a URL into components.
 * @type {!RegExp}
 * @private
 * @const
 */
bot.Device.URL_REGEXP_ = new RegExp(
    '^' +
    '([^:/?#.]+:)?' +   // protocol
    '(?://([^/]*))?' +  // host
    '([^?#]+)?' +       // pathname
    '(\\?[^#]*)?' +     // search
    '(#.*)?' +          // hash
    '$');


/**
 * Resolves a potentially relative URL against a base location.
 * @param {!Location} base Base location against which to resolve.
 * @param {string} rel Url to resolve against the location.
 * @return {string} Resolution of url against base location.
 * @private
 */
bot.Device.resolveUrl_ = function(base, rel) {
  var m = rel.match(bot.Device.URL_REGEXP_);
  if (!m) {
    return '';
  }
  var target = {
    protocol: m[1] || '',
    host: m[2] || '',
    pathname: m[3] || '',
    search: m[4] || '',
    hash: m[5] || ''
  };

  if (!target.protocol) {
    target.protocol = base.protocol;
    if (!target.host) {
      target.host = base.host;
      if (!target.pathname) {
        target.pathname = base.pathname;
        target.search = target.search || base.search;
      } else if (target.pathname.charAt(0) != '/') {
        var lastSlashIndex = base.pathname.lastIndexOf('/');
        if (lastSlashIndex != -1) {
          var directory = base.pathname.substr(0, lastSlashIndex + 1);
          target.pathname = directory + target.pathname;
        }
      }
    }
  }

  return target.protocol + '//' + target.host + target.pathname +
      target.search + target.hash;
};
// Copyright 2012 Software Freedom Conservancy
// Copyright 2010 WebDriver committers
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview DOM manipulation and querying routines.
 */

goog.provide('bot.dom');

goog.require('bot');
goog.require('bot.locators.xpath');
goog.require('bot.userAgent');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.NodeIterator');
goog.require('goog.dom.NodeType');
goog.require('goog.dom.TagName');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Rect');
goog.require('goog.math.Size');
goog.require('goog.string');
goog.require('goog.style');


/**
 * Retrieves the active element for a node's owner document.
 * @param {!(Node|Window)} nodeOrWindow The node whose owner document to get
 *     the active element for.
 * @return {Element} The active element, if any.
 */
bot.dom.getActiveElement = function(nodeOrWindow) {
  return goog.dom.getOwnerDocument(nodeOrWindow).activeElement;
};


/**
 * Returns whether the given node is an element and, optionally, whether it has
 * the given tag name. If the tag name is not provided, returns true if the node
 * is an element, regardless of the tag name.h
 *
 * @param {Node} node The node to test.
 * @param {goog.dom.TagName=} opt_tagName Tag name to test the node for.
 * @return {boolean} Whether the node is an element with the given tag name.
 */
bot.dom.isElement = function(node, opt_tagName) {
  return !!node && node.nodeType == goog.dom.NodeType.ELEMENT &&
      (!opt_tagName || node.tagName.toUpperCase() == opt_tagName);
};


/**
 * Returns whether an element is in an interactable state: whether it is shown
 * to the user, ignoring its opacity, and whether it is enabled.
 *
 * @param {!Element} element The element to check.
 * @return {boolean} Whether the element is interactable.
 * @see bot.dom.isShown.
 * @see bot.dom.isEnabled
 */
bot.dom.isInteractable = function(element) {
  return bot.dom.isShown(element, /*ignoreOpacity=*/true) &&
         bot.dom.isEnabled(element);
};


/**
 * Returns whether the element can be checked or selected.
 *
 * @param {!Element} element The element to check.
 * @return {boolean} Whether the element could be checked or selected.
 */
bot.dom.isSelectable = function(element) {
  if (bot.dom.isElement(element, goog.dom.TagName.OPTION)) {
    return true;
  }

  if (bot.dom.isElement(element, goog.dom.TagName.INPUT)) {
    var type = element.type.toLowerCase();
    return type == 'checkbox' || type == 'radio';
  }

  return false;
};


/**
 * Returns whether the element is checked or selected.
 *
 * @param {!Element} element The element to check.
 * @return {boolean} Whether the element is checked or selected.
 */
bot.dom.isSelected = function(element) {
  if (!bot.dom.isSelectable(element)) {
    throw new bot.Error(bot.ErrorCode.ELEMENT_NOT_SELECTABLE,
        'Element is not selectable');
  }

  var propertyName = 'selected';
  var type = element.type && element.type.toLowerCase();
  if ('checkbox' == type || 'radio' == type) {
    propertyName = 'checked';
  }

  return !!bot.dom.getProperty(element, propertyName);
};


/**
 * List of the focusable fields, according to
 * http://www.w3.org/TR/html401/interact/scripts.html#adef-onfocus
 * @type {!Array.<!goog.dom.TagName>}
 * @const
 * @private
 */
bot.dom.FOCUSABLE_FORM_FIELDS_ = [
  goog.dom.TagName.A,
  goog.dom.TagName.AREA,
  goog.dom.TagName.BUTTON,
  goog.dom.TagName.INPUT,
  goog.dom.TagName.LABEL,
  goog.dom.TagName.SELECT,
  goog.dom.TagName.TEXTAREA
];


/**
 * Returns whether a node is a focusable element.  An element may receive focus
 * if it is a form field or has a positive tabindex.
 * @param {!Element} element The node to test.
 * @return {boolean} Whether the node is focusable.
 */
bot.dom.isFocusable = function(element) {
  return goog.array.some(bot.dom.FOCUSABLE_FORM_FIELDS_, function(tagName) {
    return element.tagName.toUpperCase() == tagName;
  }) || (bot.dom.getAttribute(element, 'tabindex') != null &&
         Number(bot.dom.getProperty(element, 'tabIndex')) >= 0);
};


/**
 * Common aliases for properties. This maps names that users use to the correct
 * property name.
 *
 * @const
 * @private
 */
bot.dom.PROPERTY_ALIASES_ = {
  'class': 'className',
  'readonly': 'readOnly'
};


/**
 * A list of boolean properties that are defined for all elements
 * according to the HTML5 spec. If any of these are missing when
 * calling 'getProperty' they default to false.
 *
 * http://dev.w3.org/html5/spec/Overview.html#elements-in-the-dom
 *
 * @const
 * @private
 */
bot.dom.BOOLEAN_PROPERTIES_ = [
  'checked',
  'disabled',
  'draggable',
  'hidden'
];


/**
 * Looks up the given property (not to be confused with an attribute) on the
 * given element. The following properties are aliased so that they return the
 * values expected by users:
 *
 * <ul>
 * <li>class - as "className"
 * <li>readonly - as "readOnly"
 * </ul>
 *
 * @param {!Element} element The element to use.
 * @param {string} propertyName The name of the property.
 * @return {*} The value of the property.
 */
bot.dom.getProperty = function(element, propertyName) {
  var key = bot.dom.PROPERTY_ALIASES_[propertyName] || propertyName;

  var value = element[key];
  if (!goog.isDef(value) &&
      goog.array.contains(bot.dom.BOOLEAN_PROPERTIES_, key)) {
    return false;
  }

  if (propertyName == 'value' &&
      bot.dom.isElement(element, goog.dom.TagName.OPTION) &&
      !bot.dom.hasAttribute(element, propertyName)) {
    // See http://www.w3.org/TR/1999/REC-html401-19991224/interact/forms.html#adef-value-OPTION
    // IE does not adhere to this behaviour, so we hack it in.
    value = goog.dom.getRawTextContent(element);
  }
  return value;
};


/**
 * Used to determine whether we should return a boolean value from getAttribute.
 * These are all extracted from the WHATWG spec:
 *
 *   http://www.whatwg.org/specs/web-apps/current-work/
 *
 * These must all be lower-case.
 *
 * @const
 * @private
 */
bot.dom.BOOLEAN_ATTRIBUTES_ = [
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'compact',
  'complete',
  'controls',
  'declare',
  'defaultchecked',
  'defaultselected',
  'defer',
  'disabled',
  'draggable',
  'ended',
  'formnovalidate',
  'hidden',
  'indeterminate',
  'iscontenteditable',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nohref',
  'noresize',
  'noshade',
  'novalidate',
  'nowrap',
  'open',
  'paused',
  'pubdate',
  'readonly',
  'required',
  'reversed',
  'scoped',
  'seamless',
  'seeking',
  'selected',
  'spellcheck',
  'truespeed',
  'willvalidate'
];


/**
 * Get the user-specified value of the given attribute of the element, or null
 * if no such value. This method endeavours to return consistent values between
 * browsers. For boolean attributes such as "selected" or "checked", it returns
 * the string "true" if it is present and null if it is not. For the style
 * attribute, it standardizes the value to a lower-case string with a trailing
 * semi-colon.
 *
 * @param {!Element} element The element to use.
 * @param {string} attributeName The name of the attribute to return.
 * @return {?string} The value of the attribute or "null" if entirely missing.
 */
bot.dom.getAttribute = function(element, attributeName) {
  // Protect ourselves from the case where documentElementsByTagName also
  // returns comments in IE.
  if (goog.dom.NodeType.COMMENT == element.nodeType) {
    return null;
  }

  attributeName = attributeName.toLowerCase();

  // The style attribute should be a css text string that includes only what
  // the HTML element specifies itself (excluding what is inherited from parent
  // elements or style sheets). We standardize the format of this string by:
  // (1) converting it to lowercase
  // (2) ensuring it ends in a trailing semi-colon
  // (3) removing empty style values (which only appear on Opera).
  if (attributeName == 'style') {
    var css = goog.string.trim(element.style.cssText).toLowerCase();
    css = css.charAt(css.length - 1) == ';' ? css : css + ';';
    return goog.userAgent.OPERA ? css.replace(/\w+:;/g, '') : css;
  }

  var attr = element.getAttributeNode(attributeName);

  // IE8/9 in standards mode handles boolean attributes differently (of
  // course!). This if-statement is nested so the compiler can easily strip it
  // out when compiled for non-IE browsers.
  if (goog.userAgent.IE) {
    if (!attr && goog.userAgent.isVersion(8) &&
        goog.array.contains(bot.dom.BOOLEAN_ATTRIBUTES_, attributeName)) {
      attr = element[attributeName];
    }
  }

  if (!attr) {
    return null;
  }

  // Attempt to always return either true or null for boolean attributes.
  // In IE, attributes will sometimes be present even when not user-specified.
  // We would like to rely on the 'specified' property of attribute nodes, but
  // that is sometimes false for user-specified boolean attributes.
  // IE does consistently yield 'true' or 'false' strings for boolean attribute
  // values, and so we know 'false' attribute values were not user-specified.
  if (goog.array.contains(bot.dom.BOOLEAN_ATTRIBUTES_, attributeName)) {
    return bot.userAgent.IE_DOC_PRE9 && attr.value == 'false' ? null : 'true';
  }

  // For non-boolean attributes, we compensate for IE's extra attributes by
  // returning null if the 'specified' property of the attributes node is false.
  return attr.specified ? attr.value : null;
};


/**
 * Check if the DOM element has a particular attribute.
 * Convenience method since IE6/7 do not supply it.
 *
 * @param {!Element} element The element to use.
 * @param {string} attributeName The name of the attribute.
 * @return {boolean} Whether the node has the attribute, regardless of whether
 *      it is the default value or user defined.
 */
bot.dom.hasAttribute = function(element, attributeName) {
  attributeName = attributeName.toLowerCase();
  if (element.hasAttribute) {
    return element.hasAttribute(attributeName);
  } else {
    try {
      return element.attributes[attributeName].specified;
    } catch (e) {
      return false;
    }
  }
}


/**
 * List of elements that support the "disabled" attribute, as defined by the
 * HTML 4.01 specification.
 * @type {!Array.<goog.dom.TagName>}
 * @const
 * @private
 * @see http://www.w3.org/TR/html401/interact/forms.html#h-17.12.1
 */
bot.dom.DISABLED_ATTRIBUTE_SUPPORTED_ = [
  goog.dom.TagName.BUTTON,
  goog.dom.TagName.INPUT,
  goog.dom.TagName.OPTGROUP,
  goog.dom.TagName.OPTION,
  goog.dom.TagName.SELECT,
  goog.dom.TagName.TEXTAREA
];


/**
 * Determines if an element is enabled. An element is considered enabled if it
 * does not support the "disabled" attribute, or if it is not disabled.
 * @param {!Element} el The element to test.
 * @return {boolean} Whether the element is enabled.
 */
bot.dom.isEnabled = function(el) {
  var tagName = el.tagName.toUpperCase();
  if (!goog.array.contains(bot.dom.DISABLED_ATTRIBUTE_SUPPORTED_, tagName)) {
    return true;
  }

  if (bot.dom.getProperty(el, 'disabled')) {
    return false;
  }

  // The element is not explicitly disabled, but if it is an OPTION or OPTGROUP,
  // we must test if it inherits its state from a parent.
  if (el.parentNode &&
      el.parentNode.nodeType == goog.dom.NodeType.ELEMENT &&
      goog.dom.TagName.OPTGROUP == tagName ||
      goog.dom.TagName.OPTION == tagName) {
    return bot.dom.isEnabled((/**@type{!Element}*/el.parentNode));
  }
  return true;
};


/**
 * List of input types that create text fields.
 * @type {!Array.<String>}
 * @const
 * @private
 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#attr-input-type
 */
bot.dom.TEXTUAL_INPUT_TYPES_ = [
  'text',
  'search',
  'tel',
  'url',
  'email',
  'password',
  'number'
];


/**
 * TODO(user): Add support for designMode elements.
 *
 * @param {!Element} element The element to check.
 * @return {boolean} Whether the element accepts user-typed text.
 */
bot.dom.isTextual = function(element) {
  if (bot.dom.isElement(element, goog.dom.TagName.TEXTAREA)) {
    return true;
  }

  if (bot.dom.isElement(element, goog.dom.TagName.INPUT)) {
    var type = element.type.toLowerCase();
    return goog.array.contains(bot.dom.TEXTUAL_INPUT_TYPES_, type);
  }

  if (bot.dom.isContentEditable(element)) {
    return true;
  }

  return false;
};


/**
 * @param {!Element} element The element to check.
 * @return {boolean} Whether the element is contentEditable.
 */
bot.dom.isContentEditable = function(element) {
  // Check if browser supports contentEditable.
  if (!goog.isDef(element['contentEditable'])) {
    return false;
  }

  // Checking the element's isContentEditable property is preferred except for
  // IE where that property is not reliable on IE versions 7, 8, and 9.
  if (!goog.userAgent.IE && goog.isDef(element['isContentEditable'])) {
    return element.isContentEditable;
  }

  // For IE and for browsers where contentEditable is supported but
  // isContentEditable is not, traverse up the ancestors:
  function legacyIsContentEditable(e) {
    if (e.contentEditable == 'inherit') {
      var parent = bot.dom.getParentElement(e);
      return parent ? legacyIsContentEditable(parent) : false;
    } else {
      return e.contentEditable == 'true';
    }
  }
  return legacyIsContentEditable(element);
};


/**
 * TODO(user): Merge isTextual into this function and move to bot.dom.
 * For Puppet, requires adding support to getVisibleText for grabbing
 * text from all textual elements.
 *
 * Whether the element may contain text the user can edit.
 *
 * @param {!Element} element The element to check.
 * @return {boolean} Whether the element accepts user-typed text.
 */
bot.dom.isEditable = function(element) {
  return bot.dom.isTextual(element) &&
      !bot.dom.getProperty(element, 'readOnly');
};


/**
 * Returns the parent element of the given node, or null. This is required
 * because the parent node may not be another element.
 *
 * @param {!Node} node The node who's parent is desired.
 * @return {Element} The parent element, if available, null otherwise.
 */
bot.dom.getParentElement = function(node) {
  var elem = node.parentNode;

  while (elem &&
         elem.nodeType != goog.dom.NodeType.ELEMENT &&
         elem.nodeType != goog.dom.NodeType.DOCUMENT &&
         elem.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    elem = elem.parentNode;
  }
  return (/** @type {Element} */ bot.dom.isElement(elem) ? elem : null);
};


/**
 * Retrieves an explicitly-set, inline style value of an element. This returns
 * '' if there isn't a style attribute on the element or if this style property
 * has not been explicitly set in script.
 *
 * @param {!Element} elem Element to get the style value from.
 * @param {string} styleName Name of the style property in selector-case.
 * @return {string} The value of the style property.
 */
bot.dom.getInlineStyle = function(elem, styleName) {
  return goog.style.getStyle(elem, styleName);
};


/**
 * Retrieves the implicitly-set, effective style of an element, or null if it is
 * unknown. It returns the computed style where available; otherwise it looks
 * up the DOM tree for the first style value not equal to 'inherit,' using the
 * IE currentStyle of each node if available, and otherwise the inline style.
 * Since the computed, current, and inline styles can be different, the return
 * value of this function is not always consistent across browsers. See:
 * http://code.google.com/p/doctype/wiki/ArticleComputedStyleVsCascadedStyle
 *
 * @param {!Element} elem Element to get the style value from.
 * @param {string} styleName Name of the style property in selector-case.
 * @return {?string} The value of the style property, or null.
 */
bot.dom.getEffectiveStyle = function(elem, styleName) {
  styleName = goog.string.toCamelCase(styleName);
  return goog.style.getComputedStyle(elem, styleName) ||
      bot.dom.getCascadedStyle_(elem, styleName);
};


/**
 * Looks up the DOM tree for the first style value not equal to 'inherit,' using
 * the currentStyle of each node if available, and otherwise the inline style.
 *
 * @param {!Element} elem Element to get the style value from.
 * @param {string} styleName CSS style property in camelCase.
 * @return {?string} The value of the style property, or null.
 * @private
 */
bot.dom.getCascadedStyle_ = function(elem, styleName) {
  var style = elem.currentStyle || elem.style;
  var value = style[styleName];
  if (!goog.isDef(value) && goog.isFunction(style['getPropertyValue'])) {
    value = style['getPropertyValue'](styleName);
  }

  if (value != 'inherit') {
    return goog.isDef(value) ? value : null;
  }
  var parent = bot.dom.getParentElement(elem);
  return parent ? bot.dom.getCascadedStyle_(parent, styleName) : null;
};


/**
 * @param {!Element} element The element to use.
 * @return {!goog.math.Size} The dimensions of the element.
 * @private
 */
bot.dom.getElementSize_ = function(element) {
  if (goog.isFunction(element['getBBox'])) {
    try {
      var bb = element['getBBox']();
      if (bb) {
        // Opera will return an undefined bounding box for SVG elements.
        // Which makes sense, but isn't useful.
        return bb;
      }
    } catch (e) {
      // Firefox will always throw for certain SVG elements,
      // even if the function exists.
    }
  }
  return goog.style.getSize(element);
};


/**
 * Determines whether an element is what a user would call "shown". This means
 * that the element is shown in the viewport of the browser, and only has
 * height and width greater than 0px, and that its visibility is not "hidden"
 * and its display property is not "none".
 * Options and Optgroup elements are treated as special cases: they are
 * considered shown iff they have a enclosing select element that is shown.
 *
 * @param {!Element} elem The element to consider.
 * @param {boolean=} opt_ignoreOpacity Whether to ignore the element's opacity
 *     when determining whether it is shown; defaults to false.
 * @return {boolean} Whether or not the element is visible.
 */
bot.dom.isShown = function(elem, opt_ignoreOpacity) {
  if (!bot.dom.isElement(elem)) {
    throw new Error('Argument to isShown must be of type Element');
  }

  // Option or optgroup is shown iff enclosing select is shown (ignoring the
  // select's opacity).
  if (bot.dom.isElement(elem, goog.dom.TagName.OPTION) ||
      bot.dom.isElement(elem, goog.dom.TagName.OPTGROUP)) {
    var select = /**@type {Element}*/ (goog.dom.getAncestor(elem, function(e) {
      return bot.dom.isElement(e, goog.dom.TagName.SELECT);
    }));
    return !!select && bot.dom.isShown(select, /*ignoreOpacity=*/true);
  }

  // Map is shown iff image that uses it is shown.
  if (bot.dom.isElement(elem, goog.dom.TagName.MAP)) {
    if (!elem.name) {
      return false;
    }
    var mapDoc = goog.dom.getOwnerDocument(elem);
    var mapImage;
    // TODO(user): Avoid brute-force search once a cross-browser xpath
    // locator is available.
    if (mapDoc['evaluate']) {
      // The "//*" XPath syntax can confuse the closure compiler, so we use
      // the "/descendant::*" syntax instead.
      // TODO(jleyba): Try to find a reproducible case for the compiler bug.
      // TODO(jleyba): Restrict to applet, img, input:image, and object nodes.
      var imageXpath = '/descendant::*[@usemap = "#' + elem.name + '"]';

      // TODO(user): Break dependency of bot.locators on bot.dom,
      // so bot.locators.findElement can be called here instead.
      mapImage = bot.locators.xpath.single(imageXpath, mapDoc);
    } else {
      mapImage = goog.dom.findNode(mapDoc, function(n) {
        return bot.dom.isElement(n) &&
               bot.dom.getAttribute(n, 'usemap') == '#' + elem.name;
      });
    }
    return !!mapImage && bot.dom.isShown((/** @type {!Element} */ mapImage),
        opt_ignoreOpacity);
  }

  // Area is shown iff enclosing map is shown.
  if (bot.dom.isElement(elem, goog.dom.TagName.AREA)) {
    var map = /**@type {Element}*/ (goog.dom.getAncestor(elem, function(e) {
      return bot.dom.isElement(e, goog.dom.TagName.MAP);
    }));
    return !!map && bot.dom.isShown(map, opt_ignoreOpacity);
  }

  // Any hidden input is not shown.
  if (bot.dom.isElement(elem, goog.dom.TagName.INPUT) &&
      elem.type.toLowerCase() == 'hidden') {
    return false;
  }

  // Any NOSCRIPT element is not shown.
  if (bot.dom.isElement(elem, goog.dom.TagName.NOSCRIPT)) {
    return false;
  }

  // Any element with hidden visibility is not shown.
  if (bot.dom.getEffectiveStyle(elem, 'visibility') == 'hidden') {
    return false;
  }

  // Any element with a display style equal to 'none' or that has an ancestor
  // with display style equal to 'none' is not shown.
  function displayed(e) {
    if (bot.dom.getEffectiveStyle(e, 'display') == 'none') {
      return false;
    }
    var parent = bot.dom.getParentElement(e);
    return !parent || displayed(parent);
  }
  if (!displayed(elem)) {
    return false;
  }

  // Any transparent element is not shown.
  if (!opt_ignoreOpacity && bot.dom.getOpacity(elem) == 0) {
    return false;
  }

  // Any element without positive size dimensions is not shown.
  function positiveSize(e) {
    var size = bot.dom.getElementSize_(e);
    if (size.height > 0 && size.width > 0) {
      return true;
    }
    // Zero-sized elements should still be considered to have positive size
    // if they have a child element or text node with positive size.
    return goog.array.some(e.childNodes, function(n) {
      return n.nodeType == goog.dom.NodeType.TEXT ||
             (bot.dom.isElement(n) && positiveSize(n));
    });
  }
  if (!positiveSize(elem)) {
    return false;
  }

  // Elements should be hidden if their parent has a fixed size AND has the style
  // overflow:hidden AND the element's location is not within the fixed size 
  // of the parent
  function isOverflowHiding(e) {
    var parent = bot.dom.getParentElement(e);
    if (parent && bot.dom.getEffectiveStyle(parent, 'overflow') == 'hidden') {
      var sizeOfParent = bot.dom.getElementSize_(parent); 
      var locOfParent = goog.style.getClientPosition(parent);
      var locOfElement = goog.style.getClientPosition(e);

      if (locOfParent.x + sizeOfParent.width < locOfElement.x) {
        return false;
      }
      if (locOfParent.y + sizeOfParent.height < locOfElement.y) {
        return false;
      }
      return isOverflowHiding(parent);
    }
    return true;
  }

  if (!isOverflowHiding(elem)){
    return false;
  }

  return true;
};


/**
 * Trims leading and trailing whitespace from strings, leaving non-breaking
 * space characters in place.
 *
 * @param {string} str The string to trim.
 * @return {string} str without any leading or trailing whitespace characters
 *     except non-breaking spaces.
 * @private
 */
bot.dom.trimExcludingNonBreakingSpaceCharacters_ = function(str) {
  return str.replace(/^[^\S\xa0]+|[^\S\xa0]+$/g, '');
};


/**
 * @param {!Element} elem The element to consider.
 * @return {string} visible text.
 */
bot.dom.getVisibleText = function(elem) {
  var lines = [];
  bot.dom.appendVisibleTextLinesFromElement_(elem, lines);
  lines = goog.array.map(
      lines,
      bot.dom.trimExcludingNonBreakingSpaceCharacters_);
  var joined = lines.join('\n');
  var trimmed = bot.dom.trimExcludingNonBreakingSpaceCharacters_(joined);

  // Replace non-breakable spaces with regular ones.
  return trimmed.replace(/\xa0/g, ' ');
};


/**
 * @param {!Element} elem Element.
 * @param {!Array.<string>} lines Accumulated visible lines of text.
 * @private
 */
bot.dom.appendVisibleTextLinesFromElement_ = function(elem, lines) {
  function currLine() {
    return (/** @type {string|undefined} */ goog.array.peek(lines)) || '';
  }

  // TODO(user): Add case here for textual form elements.
  if (bot.dom.isElement(elem, goog.dom.TagName.BR)) {
    lines.push('');
  } else {
    // TODO: properly handle display:run-in
    var isTD = bot.dom.isElement(elem, goog.dom.TagName.TD);
    var display = bot.dom.getEffectiveStyle(elem, 'display');
    // On some browsers, table cells incorrectly show up with block styles.
    var isBlock = !isTD &&
        !goog.array.contains(bot.dom.INLINE_DISPLAY_BOXES_, display);

    // Add a newline before block elems when there is text on the current line.
    if (isBlock && !goog.string.isEmpty(currLine())) {
      lines.push('');
    }

    // This element may be considered unshown, but have a child that is
    // explicitly shown (e.g. this element has "visibility:hidden").
    // Nevertheless, any text nodes that are direct descendants of this
    // element will not contribute to the visible text.
    var shown = bot.dom.isShown(elem);

    // All text nodes that are children of this element need to know the
    // effective "white-space" and "text-transform" styles to properly
    // compute their contribution to visible text. Compute these values once.
    var whitespace = null, textTransform = null;
    if (shown) {
      whitespace = bot.dom.getEffectiveStyle(elem, 'white-space');
      textTransform = bot.dom.getEffectiveStyle(elem, 'text-transform');
    }

    goog.array.forEach(elem.childNodes, function(node) {
      if (node.nodeType == goog.dom.NodeType.TEXT && shown) {
        var textNode = (/** @type {!Text} */ node);
        bot.dom.appendVisibleTextLinesFromTextNode_(textNode, lines,
            whitespace, textTransform);
      } else if (bot.dom.isElement(node)) {
        var castElem = (/** @type {!Element} */ node);
        bot.dom.appendVisibleTextLinesFromElement_(castElem, lines);
      }
    });

    var line = currLine();

    // Here we differ from standard innerText implementations (if there were
    // such a thing). Usually, table cells are separated by a tab, but we
    // normalize tabs into single spaces.
    if ((isTD || display == 'table-cell') && line &&
        !goog.string.endsWith(line, ' ')) {
      lines[lines.length - 1] += ' ';
    }

    // Add a newline after block elems when there is text on the current line.
    if (isBlock && !goog.string.isEmpty(line)) {
      lines.push('');
    }
  }
};


/**
 * Elements with one of these effective "display" styles are treated as inline
 * display boxes and have their visible text appended to the current line.
 * @type {!Array.<string>}
 * @private
 * @const
 */
bot.dom.INLINE_DISPLAY_BOXES_ = [
  'inline',
  'inline-block',
  'inline-table',
  'none',
  'table-cell',
  'table-column',
  'table-column-group'
];


/**
 * @param {!Text} textNode Text node.
 * @param {!Array.<string>} lines Accumulated visible lines of text.
 * @param {?string} whitespace Parent element's "white-space" style.
 * @param {?string} textTransform Parent element's "text-transform" style.
 * @private
 */
bot.dom.appendVisibleTextLinesFromTextNode_ = function(textNode, lines,
    whitespace, textTransform) {
  // First, replace all zero-width spaces. Do this before regularizing spaces
  // as the zero-width space is, by definition, a space.
  var text = textNode.nodeValue.replace(/\u200b/g, '');

  // Canonicalize the new lines, and then collapse new lines
  // for the whitespace styles that collapse. See:
  // https://developer.mozilla.org/en/CSS/white-space
  text = goog.string.canonicalizeNewlines(text);
  if (whitespace == 'normal' || whitespace == 'nowrap') {
    text = text.replace(/\n/g, ' ');
  }

  // For pre and pre-wrap whitespace styles, convert all breaking spaces to be
  // non-breaking, otherwise, collapse all breaking spaces. Breaking spaces are
  // converted to regular spaces by getVisibleText().
  if (whitespace == 'pre' || whitespace == 'pre-wrap') {
    text = text.replace(/[ \f\t\v\u2028\u2029]/g, '\xa0');
  } else {
    text = text.replace(/[\ \f\t\v\u2028\u2029]+/g, ' ');
  }

  if (textTransform == 'capitalize') {
    text = text.replace(/(^|\s)(\S)/g, function() {
      return arguments[1] + arguments[2].toUpperCase();
    });
  } else if (textTransform == 'uppercase') {
    text = text.toUpperCase();
  } else if (textTransform == 'lowercase') {
    text = text.toLowerCase();
  }

  var currLine = lines.pop() || '';
  if (goog.string.endsWith(currLine, ' ') &&
      goog.string.startsWith(text, ' ')) {
    text = text.substr(1);
  }
  lines.push(currLine + text);
};


/**
 * Gets the opacity of a node (x-browser).
 * This gets the inline style opacity of the node and takes into account the
 * cascaded or the computed style for this node.
 *
 * @param {!Element} elem Element whose opacity has to be found.
 * @return {number} Opacity between 0 and 1.
 */
bot.dom.getOpacity = function(elem) {
  if (!goog.userAgent.IE) {
    return bot.dom.getOpacityNonIE_(elem);
  } else {
    if (bot.dom.getEffectiveStyle(elem, 'position') == 'relative') {
      // Filter does not apply to non positioned elements.
      return 1;
    }

    var opacityStyle = bot.dom.getEffectiveStyle(elem, 'filter');
    var groups = opacityStyle.match(/^alpha\(opacity=(\d*)\)/) ||
        opacityStyle.match(
        /^progid:DXImageTransform.Microsoft.Alpha\(Opacity=(\d*)\)/);

    if (groups) {
      return Number(groups[1]) / 100;
    } else {
      return 1; // Opaque.
    }
  }
};


/**
 * Implementation of getOpacity for browsers that do support
 * the "opacity" style.
 *
 * @param {!Element} elem Element whose opacity has to be found.
 * @return {number} Opacity between 0 and 1.
 * @private
 */
bot.dom.getOpacityNonIE_ = function(elem) {
  // By default the element is opaque.
  var elemOpacity = 1;

  var opacityStyle = bot.dom.getEffectiveStyle(elem, 'opacity');
  if (opacityStyle) {
    elemOpacity = Number(opacityStyle);
  }

  // Let's apply the parent opacity to the element.
  var parentElement = bot.dom.getParentElement(elem);
  if (parentElement) {
    elemOpacity = elemOpacity * bot.dom.getOpacityNonIE_(parentElement);
  }
  return elemOpacity;
};


/**
 * This function calculates the amount of scrolling necessary to bring the
 * target location into view.
 *
 * @param {number} targetLocation The target location relative to the current
 *     viewport.
 * @param {number} viewportDimension The size of the current viewport.
 * @return {number} Returns the scroll offset necessary to bring the given
 *     target location into view.
 * @private
 */
bot.dom.calculateViewportScrolling_ =
    function(targetLocation, viewportDimension) {

  if (targetLocation >= viewportDimension) {
    // Scroll until the target location appears on the right/bottom side of
    // the viewport.
    return targetLocation - (viewportDimension - 1);
  }

  if (targetLocation < 0) {
    // Scroll until the target location appears on the left/top side of the
    // viewport.
    return targetLocation;
  }

  // The location is already within the viewport. No scrolling necessary.
  return 0;
};


/**
 * This function takes a relative location according to the current viewport. If
 * this location is not visible in the viewport, it scrolls the location into
 * view. The function returns the new relative location after scrolling.
 *
 * @param {!goog.math.Coordinate} targetLocation The target location relative
 *     to (0, 0) coordinate of the viewport.
 * @param {!Window=} opt_currentWindow The current browser window.
 * @return {!goog.math.Coordinate} The target location within the viewport
 *     after scrolling.
 */
bot.dom.getInViewLocation =
    function(targetLocation, opt_currentWindow) {
  var currentWindow = opt_currentWindow || bot.getWindow();
  var viewportSize = goog.dom.getViewportSize(currentWindow);

  var xScrolling = bot.dom.calculateViewportScrolling_(
      targetLocation.x,
      viewportSize.width);

  var yScrolling = bot.dom.calculateViewportScrolling_(
      targetLocation.y,
      viewportSize.height);

  var scrollOffset =
      goog.dom.getDomHelper(currentWindow.document).getDocumentScroll();

  if (xScrolling != 0 || yScrolling != 0) {
    currentWindow.scrollBy(xScrolling, yScrolling);
  }

  // It is difficult to determine the size of the web page in some browsers.
  // We check if the scrolling we intended to do really happened. If not we
  // assume that the target location is not on the web page.
  var newScrollOffset =
      goog.dom.getDomHelper(currentWindow.document).getDocumentScroll();

  if ((scrollOffset.x + xScrolling != newScrollOffset.x) ||
      (scrollOffset.y + yScrolling != newScrollOffset.y)) {
    throw new bot.Error(bot.ErrorCode.MOVE_TARGET_OUT_OF_BOUNDS,
        'The target location (' + (targetLocation.x + scrollOffset.x) +
        ', ' + (targetLocation.y + scrollOffset.y) + ') is not on the ' +
        'webpage.');
  }

  var inViewLocation = new goog.math.Coordinate(
      targetLocation.x - xScrolling,
      targetLocation.y - yScrolling);

  // The target location should be within the viewport after scrolling.
  // This is assertion code. We do not expect them ever to become true.
  if (0 > inViewLocation.x || inViewLocation.x >= viewportSize.width) {
    throw new bot.Error(bot.ErrorCode.MOVE_TARGET_OUT_OF_BOUNDS,
        'The target location (' +
        inViewLocation.x + ', ' + inViewLocation.y +
        ') should be within the viewport (' +
        viewportSize.width + ':' + viewportSize.height +
        ') after scrolling.');
  }

  if (0 > inViewLocation.y || inViewLocation.y >= viewportSize.height) {
    throw new bot.Error(bot.ErrorCode.MOVE_TARGET_OUT_OF_BOUNDS,
        'The target location (' +
        inViewLocation.x + ', ' + inViewLocation.y +
        ') should be within the viewport (' +
        viewportSize.width + ':' + viewportSize.height +
        ') after scrolling.');
  }

  return inViewLocation;
};


/**
 * Scrolls the scrollable element so that the region is fully visible.
 * If the region is too large, it will be aligned to the top-left of the
 * scrollable element. The region should be relative to the scrollable
 * element's current scroll position.
 *
 * @param {!goog.math.Rect} region The region to use.
 * @param {!Element} scrollable The scrollable element to scroll.
 * @private
 */
bot.dom.scrollRegionIntoView_ = function(region, scrollable) {
  scrollable.scrollLeft += Math.min(
      region.left, Math.max(region.left - region.width, 0));
  scrollable.scrollTop += Math.min(
      region.top, Math.max(region.top - region.height, 0));
};


/**
 * Scrolls the region of an element into the container's view. If the
 * region is too large to fit in the view, it will be aligned to the
 * top-left of the container.
 *
 * The element and container should be attached to the current document.
 *
 * @param {!Element} elem The element to use.
 * @param {!goog.math.Rect} elemRegion The region relative to the element to be
 *     scrolled into view.
 * @param {!Element} container A container of the given element.
 * @private
 */
bot.dom.scrollElementRegionIntoContainerView_ = function(elem, elemRegion,
                                                         container) {
  // Based largely from goog.style.scrollIntoContainerView.
  var elemPos = goog.style.getPageOffset(elem);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);

  // Relative pos. of the element's border box to the container's content box.
  var relX = elemPos.x + elemRegion.left - containerPos.x -
             containerBorder.left;
  var relY = elemPos.y + elemRegion.top - containerPos.y - containerBorder.top;

  // How much the element can move in the container.
  var spaceX = container.clientWidth - elemRegion.width;
  var spaceY = container.clientHeight - elemRegion.height;

  bot.dom.scrollRegionIntoView_(new goog.math.Rect(relX, relY, spaceX, spaceY),
                                container);
};


/**
 * Scrolls the element into the client's view. If the element or region is
 * too large to fit in the view, it will be aligned to the top-left of the
 * container.
 *
 * The element should be attached to the current document.
 *
 * @param {!Element} elem The element to use.
 * @param {!goog.math.Rect} elemRegion The region relative to the element to be
 *     scrolled into view.
 */
bot.dom.scrollElementRegionIntoClientView = function(elem, elemRegion) {
  var doc = goog.dom.getOwnerDocument(elem);

  // Scroll the containers.
  for (var container = bot.dom.getParentElement(elem);
       container && container != doc.body && container != doc.documentElement;
       container = bot.dom.getParentElement(container)) {
    bot.dom.scrollElementRegionIntoContainerView_(elem, elemRegion, container);
  }

  // Scroll the actual window.
  var elemPageOffset = goog.style.getPageOffset(elem);

  var viewportSize = goog.dom.getDomHelper(doc).getViewportSize();

  var region = new goog.math.Rect(
      elemPageOffset.x + elemRegion.left - doc.body.scrollLeft,
      elemPageOffset.y + elemRegion.top - doc.body.scrollTop,
      viewportSize.width - elemRegion.width,
      viewportSize.height - elemRegion.height);

  bot.dom.scrollRegionIntoView_(region, doc.body || doc.documentElement);
};


/**
 * Scrolls the element into the client's view and returns its position
 * relative to the client viewport. If the element or region is too
 * large to fit in the view, it will be aligned to the top-left of the
 * container.
 *
 * The element should be attached to the current document.
 *
 * @param {!Element} elem The element to use.
 * @param {!goog.math.Rect=} opt_elemRegion The region relative to the element
 *     to be scrolled into view.
 * @return {!goog.math.Coordinate} The coordinate of the element in client
 *     space.
 */
bot.dom.getLocationInView = function(elem, opt_elemRegion) {
  var elemRegion;
  if (opt_elemRegion) {
    elemRegion = new goog.math.Rect(
        opt_elemRegion.left, opt_elemRegion.top,
        opt_elemRegion.width, opt_elemRegion.height);
  } else {
    elemRegion = new goog.math.Rect(0, 0, elem.offsetWidth, elem.offsetHeight);
  }
  bot.dom.scrollElementRegionIntoClientView(elem, elemRegion);

  // This is needed for elements that are split across multiple lines.
  var rect = elem.getClientRects ? elem.getClientRects()[0] : null;
  var elemClientPos = rect ?
      new goog.math.Coordinate(rect.left, rect.top) :
      goog.style.getClientPosition(elem);
  return new goog.math.Coordinate(elemClientPos.x + elemRegion.left,
                                  elemClientPos.y + elemRegion.top);
};


/**
 * Checks whether the element is currently scrolled in to view, such that the
 * offset given, relative to the top-left corner of the element, is currently
 * displayed in the viewport.
 *
 * @param {!Element} element The element to check.
 * @param {!goog.math.Coordinate=} opt_coords Coordinate in the element,
 *     relative to the top-left corner of the element, to check. If none are
 *     specified, checks that any part of the element is in view.
 * @return {boolean} Whether the coordinates specified, relative to the element,
 *     are scrolled in to view.
 */
bot.dom.isScrolledIntoView = function(element, opt_coords) {
  var ownerWindow = goog.dom.getWindow(goog.dom.getOwnerDocument(element));
  var topWindow = ownerWindow.top;
  var elSize = goog.style.getSize(element);

  for (var win = ownerWindow;; win = win.parent) {
    var scroll = goog.dom.getDomHelper(win.document).getDocumentScroll();
    var size = goog.dom.getViewportSize(win);
    var viewportRect = new goog.math.Rect(scroll.x,
                                          scroll.y,
                                          size.width,
                                          size.height);

    var elCoords = goog.style.getFramedPageOffset(element, win);
    var elementRect = new goog.math.Rect(elCoords.x,
                                         elCoords.y,
                                         elSize.width,
                                         elSize.height);
    if (!goog.math.Rect.intersects(viewportRect, elementRect)) {
      return false;
    }
    if (win == topWindow) {
      break;
    }
  }

  var visibleBox = goog.style.getVisibleRectForElement(element);
  if (!visibleBox) {
    return false;
  }
  if (opt_coords) {
    var elementOffset = goog.style.getPageOffset(element);
    var desiredPoint = goog.math.Coordinate.sum(elementOffset, opt_coords);
    return visibleBox.contains(desiredPoint);
  } else {
    var elementBox = goog.style.getBounds(element).toBox();
    return goog.math.Box.intersects(visibleBox, elementBox);
  }
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for working with errors as defined by WebDriver's
 * wire protocol: http://code.google.com/p/selenium/wiki/JsonWireProtocol.
 */

goog.provide('bot.Error');
goog.provide('bot.ErrorCode');

goog.require('goog.object');


/**
 * Error codes from the WebDriver wire protocol:
 * http://code.google.com/p/selenium/wiki/JsonWireProtocol#Response_Status_Codes
 *
 * @enum {number}
 */
bot.ErrorCode = {
  SUCCESS: 0,  // Included for completeness

  NO_SUCH_ELEMENT: 7,
  NO_SUCH_FRAME: 8,
  UNKNOWN_COMMAND: 9,
  UNSUPPORTED_OPERATION: 9,  // Alias.
  STALE_ELEMENT_REFERENCE: 10,
  ELEMENT_NOT_VISIBLE: 11,
  INVALID_ELEMENT_STATE: 12,
  UNKNOWN_ERROR: 13,
  ELEMENT_NOT_SELECTABLE: 15,
  JAVASCRIPT_ERROR: 17,
  XPATH_LOOKUP_ERROR: 19,
  TIMEOUT: 21,
  NO_SUCH_WINDOW: 23,
  INVALID_COOKIE_DOMAIN: 24,
  UNABLE_TO_SET_COOKIE: 25,
  MODAL_DIALOG_OPENED: 26,
  NO_MODAL_DIALOG_OPEN: 27,
  SCRIPT_TIMEOUT: 28,
  INVALID_ELEMENT_COORDINATES: 29,
  INVALID_SELECTOR_ERROR: 32,
  SQL_DATABASE_ERROR: 33,
  MOVE_TARGET_OUT_OF_BOUNDS: 34,
  IME_ENGINE_ACTIVATION_FAILED: 35,
  IME_NOT_AVAILABLE: 36
};



/**
 * Error extension that includes error status codes from the WebDriver wire
 * protocol:
 * http://code.google.com/p/selenium/wiki/JsonWireProtocol#Response_Status_Codes
 *
 * @param {!bot.ErrorCode} code The error's status code.
 * @param {string=} opt_message Optional error message.
 * @constructor
 * @extends {Error}
 */
bot.Error = function(code, opt_message) {

  /**
   * This error's status code.
   * @type {!bot.ErrorCode}
   */
  this.code = code;

  /** @override */
  this.message = opt_message || '';

  /** @override */
  this.name = (/**@type {string}*/ bot.Error.NAMES_[code] ||
      bot.Error.NAMES_[bot.ErrorCode.UNKNOWN_ERROR]);

  // Generate a stacktrace for our custom error; ensure the error has our
  // custom name and message so the stack prints correctly in all browsers.
  var template = new Error(this.message);
  template.name = this.name;

  /** @override */
  this.stack = template.stack || '';
};
goog.inherits(bot.Error, Error);


/**
 * A map of error codes to error names.
 * @type {!Object.<string>}
 * @const
 * @private
 */
bot.Error.NAMES_ = goog.object.create(
    bot.ErrorCode.NO_SUCH_ELEMENT, 'NoSuchElementError',
    bot.ErrorCode.NO_SUCH_FRAME, 'NoSuchFrameError',
    bot.ErrorCode.UNKNOWN_COMMAND, 'UnknownCommandError',
    bot.ErrorCode.STALE_ELEMENT_REFERENCE, 'StaleElementReferenceError',
    bot.ErrorCode.ELEMENT_NOT_VISIBLE, 'ElementNotVisibleError',
    bot.ErrorCode.INVALID_ELEMENT_STATE, 'InvalidElementStateError',
    bot.ErrorCode.UNKNOWN_ERROR, 'UnknownError',
    bot.ErrorCode.ELEMENT_NOT_SELECTABLE, 'ElementNotSelectableError',
    bot.ErrorCode.XPATH_LOOKUP_ERROR, 'XPathLookupError',
    bot.ErrorCode.NO_SUCH_WINDOW, 'NoSuchWindowError',
    bot.ErrorCode.INVALID_COOKIE_DOMAIN, 'InvalidCookieDomainError',
    bot.ErrorCode.UNABLE_TO_SET_COOKIE, 'UnableToSetCookieError',
    bot.ErrorCode.MODAL_DIALOG_OPENED, 'ModalDialogOpenedError',
    bot.ErrorCode.NO_MODAL_DIALOG_OPEN, 'NoModalDialogOpenError',
    bot.ErrorCode.SCRIPT_TIMEOUT, 'ScriptTimeoutError',
    bot.ErrorCode.INVALID_SELECTOR_ERROR, 'InvalidSelectorError',
    bot.ErrorCode.SQL_DATABASE_ERROR, 'SqlDatabaseError',
    bot.ErrorCode.MOVE_TARGET_OUT_OF_BOUNDS, 'MoveTargetOutOfBoundsError');


/**
 * Flag used for duck-typing when this code is embedded in a Firefox extension.
 * This is required since an Error thrown in one component and then reported
 * to another will fail instanceof checks in the second component.
 * @type {boolean}
 */
bot.Error.prototype.isAutomationError = true;


if (goog.DEBUG) {
  /** @return {string} The string representation of this error. */
  bot.Error.prototype.toString = function() {
    return '[' + this.name + '] ' + this.message;
  };
}
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Functions to do with firing and simulating events.
 */


goog.provide('bot.events');
goog.provide('bot.events.EventArgs');
goog.provide('bot.events.EventType');
goog.provide('bot.events.KeyboardArgs');
goog.provide('bot.events.MouseArgs');
goog.provide('bot.events.Touch');
goog.provide('bot.events.TouchArgs');

goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('bot.userAgent');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.userAgent');
goog.require('goog.userAgent.product');


/**
 * Whether the browser supports the construction of touch events.
 *
 * @const
 * @type {boolean}
 */
bot.events.SUPPORTS_TOUCH_EVENTS = !goog.userAgent.IE && !goog.userAgent.OPERA;


/**
 * Whether the browser supports a native touch api.
 *
 * @const
 * @type {boolean}
 * @private
 */
bot.events.BROKEN_TOUCH_API_ = (function() {
  if (goog.userAgent.product.ANDROID) {
    // Native touch api supported starting in version 4.0 (Ice Cream Sandwich).
    return !bot.userAgent.isProductVersion(4);
  }
  return !bot.userAgent.IOS;
})();


/**
 * Arguments to initialize an event.
 *
 * @typedef {bot.events.MouseArgs|bot.events.KeyboardArgs|bot.events.TouchArgs}
 */
bot.events.EventArgs;


/**
 * Arguments to initialize a mouse event.
 *
 * @typedef {{clientX: number,
 *            clientY: number,
 *            button: number,
 *            altKey: boolean,
 *            ctrlKey: boolean,
 *            shiftKey: boolean,
 *            metaKey: boolean,
 *            relatedTarget: Element,
 *            wheelDelta: number}}
 */
bot.events.MouseArgs;


/**
 * Arguments to initialize a keyboard event.
 *
 * @typedef {{keyCode: number,
 *            charCode: number,
 *            altKey: boolean,
 *            ctrlKey: boolean,
 *            shiftKey: boolean,
 *            metaKey: boolean,
 *            preventDefault: boolean}}
 */
bot.events.KeyboardArgs;


/**
 * Argument to initialize a touch event.
 *
 * @typedef {{touches: !Array.<bot.events.Touch>,
 *            targetTouches: !Array.<bot.events.Touch>,
 *            changedTouches: !Array.<bot.events.Touch>,
 *            altKey: boolean,
 *            ctrlKey: boolean,
 *            shiftKey: boolean,
 *            metaKey: boolean,
 *            relatedTarget: Element,
 *            scale: number,
 *            rotation: number}}
 */
bot.events.TouchArgs;


/**
 * @typedef {{identifier: number,
 *            screenX: number,
 *            screenY: number,
 *            clientX: number,
 *            clientY: number,
 *            pageX: number,
 *            pageY: number}}
 */
bot.events.Touch;



/**
 * Factory for event objects of a specific type.
 *
 * @constructor
 * @param {string} type Type of the created events.
 * @param {boolean} bubbles Whether the created events bubble.
 * @param {boolean} cancelable Whether the created events are cancelable.
 * @private
 */
bot.events.EventFactory_ = function(type, bubbles, cancelable) {
  /**
   * @type {string}
   * @private
   */
  this.type_ = type;

  /**
   * @type {boolean}
   * @private
   */
  this.bubbles_ = bubbles;

  /**
   * @type {boolean}
   * @private
   */
  this.cancelable_ = cancelable;
};


/**
 * Creates an event.
 *
 * @param {!Element} target Target element of the event.
 * @param {bot.events.EventArgs=} opt_args Event arguments.
 * @return {!Event} Newly created event.
 */
bot.events.EventFactory_.prototype.create = function(target, opt_args) {
  var doc = goog.dom.getOwnerDocument(target);
  var event;

  if (bot.userAgent.IE_DOC_PRE9) {
    event = doc.createEventObject();
  } else {
    event = doc.createEvent('HTMLEvents');
    event.initEvent(this.type_, this.bubbles_, this.cancelable_);
  }

  return event;
};


/**
 * Overriding toString to return the unique type string improves debugging,
 * and it allows event types to be mapped in JS objects without collisions.
 *
 * @return {string} String representation of the event type.
 */
bot.events.EventFactory_.prototype.toString = function() {
  return this.type_;
};



/**
 * Factory for mouse event objects of a specific type.
 *
 * @constructor
 * @param {string} type Type of the created events.
 * @param {boolean} bubbles Whether the created events bubble.
 * @param {boolean} cancelable Whether the created events are cancelable.
 * @extends {bot.events.EventFactory_}
 * @private
 */
bot.events.MouseEventFactory_ = function(type, bubbles, cancelable) {
  goog.base(this, type, bubbles, cancelable);
};
goog.inherits(bot.events.MouseEventFactory_, bot.events.EventFactory_);


/**
 * @inheritDoc
 */
bot.events.MouseEventFactory_.prototype.create = function(target, opt_args) {
  // Only Gecko supports the mouse pixel scroll event.
  if (!goog.userAgent.GECKO && this == bot.events.EventType.MOUSEPIXELSCROLL) {
    throw new bot.Error(bot.ErrorCode.UNSUPPORTED_OPERATION,
        'Browser does not support a mouse pixel scroll event.');
  }

  var args = (/** @type {!bot.events.MouseArgs} */ opt_args);
  var doc = goog.dom.getOwnerDocument(target);
  var event;

  if (bot.userAgent.IE_DOC_PRE9) {
    event = doc.createEventObject();
    event.altKey = args.altKey;
    event.ctrlKey = args.ctrlKey;
    event.metaKey = args.metaKey;
    event.shiftKey = args.shiftKey;
    event.button = args.button;

    // NOTE: ie8 does a strange thing with the coordinates passed in the event:
    // - if offset{X,Y} coordinates are specified, they are also used for
    //   client{X,Y}, event if client{X,Y} are also specified.
    // - if only client{X,Y} are specified, they are also used for offset{x,y}
    // Thus, for ie8, it is impossible to set both offset and client
    // and have them be correct when they come out on the other side.
    event.clientX = args.clientX;
    event.clientY = args.clientY;

    // Sets a property of the event object using Object.defineProperty.
    // Some readonly properties of the IE event object can only be set this way.
    function setEventProperty(prop, value) {
      Object.defineProperty(event, prop, {
        get: function() {
          return value;
        }
      });
    }

    // IE has fromElement and toElement properties, no relatedTarget property.
    // IE does not allow fromElement and toElement to be set directly, but
    // Object.defineProperty can redefine them, when it is available. Do not
    // use Object.defineProperties (plural) because it is even less supported.
    // If defineProperty is unavailable, fall back to setting the relatedTarget,
    // which many event frameworks, including jQuery and Closure, forgivingly
    // pass on as the relatedTarget on their event object abstraction.
    if (this == bot.events.EventType.MOUSEOUT ||
        this == bot.events.EventType.MOUSEOVER) {
      if (Object.defineProperty) {
        var out = (this == bot.events.EventType.MOUSEOUT);
        setEventProperty('fromElement', out ? target : args.relatedTarget);
        setEventProperty('toElement', out ? args.relatedTarget : target);
      } else {
        event.relatedTarget = args.relatedTarget;
      }
    }

    // IE does not allow the wheelDelta property to be set directly, so we can
    // only do it where defineProperty is supported; otherwise store the wheel
    // delta in the event "detail" as a last resort in case the app looks there.
    if (this == bot.events.EventType.MOUSEWHEEL) {
      if (Object.defineProperty) {
        setEventProperty('wheelDelta', args.wheelDelta);
      } else {
        event.detail = args.wheelDelta;
      }
    }
  } else {
    var view = goog.dom.getWindow(doc);
    event = doc.createEvent('MouseEvents');
    var detail = 1;

    // All browser but Firefox provide the wheelDelta value in the event.
    // Firefox provides the scroll amount in the detail field, where it has the
    // opposite polarity of the wheelDelta (upward scroll is negative) and is a
    // factor of 40 less than the wheelDelta value. Opera provides both values.
    // The wheelDelta value is normally some multiple of 40.
    if (this == bot.events.EventType.MOUSEWHEEL) {
      if (!goog.userAgent.GECKO) {
        event.wheelDelta = args.wheelDelta;
      }
      if (goog.userAgent.GECKO || goog.userAgent.OPERA) {
        detail = args.wheelDelta / -40;
      }
    }

    // Only Gecko supports a mouse pixel scroll event, so we use it as the
    // "standard" and pass it along as is as the "detail" of the event.
    if (goog.userAgent.GECKO && this == bot.events.EventType.MOUSEPIXELSCROLL) {
      detail = args.wheelDelta;
    }

    event.initMouseEvent(this.type_, this.bubbles_, this.cancelable_, view,
        detail, /*screenX*/ 0, /*screenY*/ 0, args.clientX, args.clientY,
        args.ctrlKey, args.altKey, args.shiftKey, args.metaKey, args.button,
        args.relatedTarget);
  }

  return event;
};



/**
 * Factory for keyboard event objects of a specific type.
 *
 * @constructor
 * @param {string} type Type of the created events.
 * @param {boolean} bubbles Whether the created events bubble.
 * @param {boolean} cancelable Whether the created events are cancelable.
 * @extends {bot.events.EventFactory_}
 * @private
 */
bot.events.KeyboardEventFactory_ = function(type, bubbles, cancelable) {
  goog.base(this, type, bubbles, cancelable);
};
goog.inherits(bot.events.KeyboardEventFactory_, bot.events.EventFactory_);


/**
 * @inheritDoc
 */
bot.events.KeyboardEventFactory_.prototype.create = function(target, opt_args) {
  var args = (/** @type {!bot.events.KeyboardArgs} */ opt_args);
  var doc = goog.dom.getOwnerDocument(target);
  var event;

  if (goog.userAgent.GECKO) {
    var view = goog.dom.getWindow(doc);
    var keyCode = args.charCode ? 0 : args.keyCode;
    event = doc.createEvent('KeyboardEvent');
    event.initKeyEvent(this.type_, this.bubbles_, this.cancelable_, view,
        args.ctrlKey, args.altKey, args.shiftKey, args.metaKey, keyCode,
        args.charCode);
    // https://bugzilla.mozilla.org/show_bug.cgi?id=501496
    if (this.type_ == bot.events.EventType.KEYPRESS && args.preventDefault) {
      event.preventDefault();
    }
  } else {
    if (bot.userAgent.IE_DOC_PRE9) {
      event = doc.createEventObject();
    } else {  // WebKit, Opera, and IE 9+ in Standards mode.
      event = doc.createEvent('Events');
      event.initEvent(this.type_, this.bubbles_, this.cancelable_);
    }
    event.altKey = args.altKey;
    event.ctrlKey = args.ctrlKey;
    event.metaKey = args.metaKey;
    event.shiftKey = args.shiftKey;
    event.keyCode = args.charCode || args.keyCode;
    if (goog.userAgent.WEBKIT) {
      event.charCode = (this == bot.events.EventType.KEYPRESS) ?
          event.keyCode : 0;
    }
  }

  return event;
};



/**
 * Factory for touch event objects of a specific type.
 *
 * @constructor
 * @param {string} type Type of the created events.
 * @param {boolean} bubbles Whether the created events bubble.
 * @param {boolean} cancelable Whether the created events are cancelable.
 * @extends {bot.events.EventFactory_}
 * @private
 */
bot.events.TouchEventFactory_ = function(type, bubbles, cancelable) {
  goog.base(this, type, bubbles, cancelable);
};
goog.inherits(bot.events.TouchEventFactory_, bot.events.EventFactory_);


/**
 * @inheritDoc
 */
bot.events.TouchEventFactory_.prototype.create = function(target, opt_args) {
  if (!bot.events.SUPPORTS_TOUCH_EVENTS) {
    throw new bot.Error(bot.ErrorCode.UNSUPPORTED_OPERATION,
        'Browser does not support firing touch events.');
  }

  var args = (/** @type {!bot.events.TouchArgs} */ opt_args);
  var doc = goog.dom.getOwnerDocument(target);
  var view = goog.dom.getWindow(doc);

  // Creates a TouchList, using native touch Api, for touch events.
  function createNativeTouchList(touchListArgs) {
    var touches = goog.array.map(touchListArgs, function(touchArg) {
      return doc.createTouch(view, target, touchArg.identifier,
          touchArg.pageX, touchArg.pageY, touchArg.screenX, touchArg.screenY);
    });

    return doc.createTouchList.apply(doc, touches);
  }

  // Creates a TouchList, using simulated touch Api, for touch events.
  function createGenericTouchList(touchListArgs) {
    var touches = goog.array.map(touchListArgs, function(touchArg) {
      // The target field is not part of the W3C spec, but both android and iOS
      // add the target field to each touch.
      return {
        identifier: touchArg.identifier,
        screenX: touchArg.screenX,
        screenY: touchArg.screenY,
        clientX: touchArg.clientX,
        clientY: touchArg.clientY,
        pageX: touchArg.pageX,
        pageY: touchArg.pageY,
        target: target
      };
    });
    touches.item = function(i) {
      return touches[i];
    };
    return touches;
  }

  function createTouchList(touches) {
    return bot.events.BROKEN_TOUCH_API_ ?
        createGenericTouchList(touches) :
        createNativeTouchList(touches);
  }

  // As a performance optimization, reuse the created touchlist when the lists
  // are the same, which is often the case in practice.
  var changedTouches = createTouchList(args.changedTouches);
  var touches = (args.touches == args.changedTouches) ?
      changedTouches : createTouchList(args.touches);
  var targetTouches = (args.targetTouches == args.changedTouches) ?
      changedTouches : createTouchList(args.targetTouches);

  var event;
  if (bot.events.BROKEN_TOUCH_API_) {
    event = doc.createEvent('MouseEvents');
    event.initMouseEvent(this.type_, this.bubbles_, this.cancelable_, view,
        /*detail*/ 1, /*screenX*/ 0, /*screenY*/ 0, args.clientX, args.clientY,
        args.ctrlKey, args.altKey, args.shiftKey, args.metaKey, /*button*/ 0,
        args.relatedTarget);
    event.touches = touches;
    event.targetTouches = targetTouches;
    event.changedTouches = changedTouches;
    event.scale = args.scale;
    event.rotation = args.rotation;
  } else {
    event = doc.createEvent('TouchEvent');
    if (goog.userAgent.product.ANDROID) {
      // Android's initTouchEvent method is not compliant with the W3C spec.
      event.initTouchEvent(touches, targetTouches, changedTouches,
          this.type_, view, /*screenX*/ 0, /*screenY*/ 0, args.clientX,
          args.clientY, args.ctrlKey, args.altKey, args.shiftKey, args.metaKey);
    } else {
      event.initTouchEvent(this.type_, this.bubbles_, this.cancelable_, view,
          /*detail*/ 1, /*screenX*/ 0, /*screenY*/ 0, args.clientX,
          args.clientY, args.ctrlKey, args.altKey, args.shiftKey, args.metaKey,
          touches, targetTouches, changedTouches, args.scale, args.rotation);
    }
    event.relatedTarget = args.relatedTarget;
  }

  return event;
};


/**
 * The types of events this modules supports firing.
 *
 * <p>To see which events bubble and are cancelable, see:
 * http://en.wikipedia.org/wiki/DOM_events
 *
 * @enum {!Object}
 */
bot.events.EventType = {
  BLUR: new bot.events.EventFactory_('blur', false, false),
  CHANGE: new bot.events.EventFactory_('change', true, false),
  FOCUS: new bot.events.EventFactory_('focus', false, false),
  INPUT: new bot.events.EventFactory_('input', false, false),
  PROPERTYCHANGE: new bot.events.EventFactory_('propertychange', false, false),
  SELECT: new bot.events.EventFactory_('select', true, false),
  SUBMIT: new bot.events.EventFactory_('submit', true, true),
  TEXTINPUT: new bot.events.EventFactory_('textInput', true, true),

  // Mouse events.
  CLICK: new bot.events.MouseEventFactory_('click', true, true),
  CONTEXTMENU: new bot.events.MouseEventFactory_('contextmenu', true, true),
  DBLCLICK: new bot.events.MouseEventFactory_('dblclick', true, true),
  MOUSEDOWN: new bot.events.MouseEventFactory_('mousedown', true, true),
  MOUSEMOVE: new bot.events.MouseEventFactory_('mousemove', true, false),
  MOUSEOUT: new bot.events.MouseEventFactory_('mouseout', true, true),
  MOUSEOVER: new bot.events.MouseEventFactory_('mouseover', true, true),
  MOUSEUP: new bot.events.MouseEventFactory_('mouseup', true, true),
  MOUSEWHEEL: new bot.events.MouseEventFactory_(
      goog.userAgent.GECKO ? 'DOMMouseScroll' : 'mousewheel', true, true),
  MOUSEPIXELSCROLL: new bot.events.MouseEventFactory_(
      'MozMousePixelScroll', true, true),

  // Keyboard events.
  KEYDOWN: new bot.events.KeyboardEventFactory_('keydown', true, true),
  KEYPRESS: new bot.events.KeyboardEventFactory_('keypress', true, true),
  KEYUP: new bot.events.KeyboardEventFactory_('keyup', true, true),

  // Touch events.
  TOUCHEND: new bot.events.TouchEventFactory_('touchend', true, true),
  TOUCHMOVE: new bot.events.TouchEventFactory_('touchmove', true, true),
  TOUCHSTART: new bot.events.TouchEventFactory_('touchstart', true, true)
};


/**
 * Fire a named event on a particular element.
 *
 * @param {!Element} target The element on which to fire the event.
 * @param {!bot.events.EventType} type Event type.
 * @param {bot.events.EventArgs=} opt_args Arguments to initialize the event.
 * @return {boolean} Whether the event fired successfully or was cancelled.
 */
bot.events.fire = function(target, type, opt_args) {
  var factory = /** @type {!bot.events.EventFactory_} */ type;
  var event = factory.create(target, opt_args);

  // Ensure the event's isTrusted property is set to false, so that
  // bot.events.isSynthetic() can identify synthetic events from native ones.
  if (!('isTrusted' in event)) {
    event.isTrusted = false;
  }

  if (bot.userAgent.IE_DOC_PRE9) {
    return target.fireEvent('on' + factory.type_, event);
  } else {
    return target.dispatchEvent(event);
  }
};


/**
 * Returns whether the event was synthetically created by the atoms;
 * if false, was created by the browser in response to a live user action.
 *
 * @param {!(Event|goog.events.BrowserEvent)} event An event.
 * @return {boolean} Whether the event was synthetically created.
 */
bot.events.isSynthetic = function(event) {
  var e = event.getBrowserEvent ? event.getBrowserEvent() : event;
  return 'isTrusted' in e ? !e.isTrusted : false;
};
// Copyright 2011 WebDriver committers
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Atoms for frame handling.
 *
 */


goog.provide('bot.frame');

goog.require('bot.locators');
goog.require('goog.array');
goog.require('goog.dom');


/**
 * @return {!Window} The top window.
 */
bot.frame.defaultContent = function() {
  return bot.getWindow().top;
};


/**
 * @return {!Element} The currently active element.
 */
bot.frame.activeElement = function() {
  return document.activeElement || document.body;
};


/**
 * Returns a reference to the window object corresponding to the given element.
 * Note that the element must be a frame or an iframe.
 *
 * @param {!(HTMLIFrameElement|HTMLFrameElement)} element The iframe or frame
 *     element.
 * @return {Window} The window reference for the given iframe or frame element.
 */
bot.frame.getFrameWindow = function(element) {
  if (bot.frame.isFrame_(element)) {
    var frame = /** @type {HTMLFrameElement|HTMLIFrameElement} */ element;
    return goog.dom.getFrameContentWindow(frame);
  }
  throw new bot.Error(bot.ErrorCode.NO_SUCH_FRAME,
      "The given element isn't a frame or an iframe.");
};


/**
 * Returns whether an element is a frame (or iframe).
 *
 * @param {!Element} element The element to check.
 * @return {boolean} Whether the element is a frame (or iframe).
 * @private
 */
bot.frame.isFrame_ = function(element) {
  return bot.dom.isElement(element, goog.dom.TagName.FRAME) ||
         bot.dom.isElement(element, goog.dom.TagName.IFRAME);
};


/**
 * Looks for a frame by its name or id (preferring name over id)
 * under the given root. If no frame was found, we look for an
 * iframe by name or id.
 *
 * @param {(string|number)} nameOrId The frame's name, the frame's id, or the
 *     index of the frame in the containing window.
 * @param {!Window=} opt_root The window to perform the search under.
 *     Defaults to {@code bot.getWindow()}.
 * @return {Window} The window if found, null otherwise.
 */
bot.frame.findFrameByNameOrId = function(nameOrId, opt_root) {
  var domWindow = opt_root || bot.getWindow();

  // Lookup frame by name
  var frame = domWindow.frames[nameOrId];
  if (frame) {
    // This is needed because Safari 4 returns
    // an HTMLFrameElement instead of a Window object.
    if (frame.document) {
      return frame;
    } else {
      return goog.dom.getFrameContentWindow(frame);
    }
  }

  // Lookup frame by id
  var elements = bot.locators.findElements({id: nameOrId},
      domWindow.document);
  for (var i = 0; i < elements.length; i++) {
    if (bot.frame.isFrame_(elements[i])) {
      return goog.dom.getFrameContentWindow(elements[i]);
    }
  }
  return null;
};


/**
 * Looks for a frame by its index under the given root.
 *
 * @param {number} index The frame's index.
 * @param {!Window=} opt_root The window to perform
 *     the search under. Defaults to {@code bot.getWindow()}.
 * @return {Window} The frame if found, null otherwise.
 */
bot.frame.findFrameByIndex = function(index, opt_root) {
  var domWindow = opt_root || bot.getWindow();
  return domWindow.frames[index] || null;
};


/**
 * Gets the index of a frame in the given window. Note that the element must
 * be a frame or an iframe.
 *
 * @param {!(HTMLIFrameElement|HTMLFrameElement)} element The iframe or frame
 *     element.
 * @param {!Window=} opt_root The window to perform the search under. Defaults
 *     to {@code bot.getWindow()}.
 * @return {?number} The index of the frame if found, null otherwise.
 */
bot.frame.getFrameIndex = function(element, opt_root) {
  try {
    var elementWindow = element.contentWindow;
  } catch (e) {
    // Happens in IE{7,8} if a frame doesn't have an enclosing frameset.
    return null;
  }

  if (!bot.frame.isFrame_(element)) {
    return null;
  }

  var domWindow = opt_root || bot.getWindow();
  for (var i = 0; i < domWindow.frames.length; i++) {
    if (elementWindow == domWindow.frames[i]) {
      return i;
    }
  }
  return null;
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Browser atom for injecting JavaScript into the page under
 * test. There is no point in using this atom directly from JavaScript.
 * Instead, it is intended to be used in its compiled form when injecting
 * script from another language (e.g. C++).
 *
 * TODO(jleyba): Add an example
 */

goog.provide('bot.inject');
goog.provide('bot.inject.cache');

goog.require('bot');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('goog.events');
goog.require('goog.json');
goog.require('goog.object');


/**
 * WebDriver wire protocol definition of a command response.
 * @typedef {{status:bot.ErrorCode, value:*}}
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#Responses
 */
bot.inject.Response;


/**
 * Key used to identify DOM elements in the WebDriver wire protocol.
 * @type {string}
 * @const
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol
 */
bot.inject.ELEMENT_KEY = 'ELEMENT';


/**
 * Key used to identify Window objects in the WebDriver wire protocol.
 * @type {string}
 * @const
 */
bot.inject.WINDOW_KEY = 'WINDOW';


/**
 * Converts an element to a JSON friendly value so that it can be
 * stringified for transmission to the injector. Values are modified as
 * follows:
 * <ul>
 * <li>booleans, numbers, strings, and null are returned as is</li>
 * <li>undefined values are returned as null</li>
 * <li>functions are returned as a string</li>
 * <li>each element in an array is recursively processed</li>
 * <li>DOM Elements are wrapped in object-literals as dictated by the
 *     WebDriver wire protocol</li>
 * <li>all other objects will be treated as hash-maps, and will be
 *     recursively processed for any string and number key types (all
 *     other key types are discarded as they cannot be converted to JSON).
 * </ul>
 *
 * @param {*} value The value to make JSON friendly.
 * @return {*} The JSON friendly value.
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol
 */
bot.inject.wrapValue = function(value) {
  switch (goog.typeOf(value)) {
    case 'string':
    case 'number':
    case 'boolean':
      return value;

    case 'function':
      return value.toString();

    case 'array':
      return goog.array.map((/**@type {goog.array.ArrayLike}*/value),
          bot.inject.wrapValue);

    case 'object':
      // Since {*} expands to {Object|boolean|number|string|undefined}, the
      // JSCompiler complains that it is too broad a type for the remainder of
      // this block where {!Object} is expected. Downcast to prevent generating
      // a ton of compiler warnings.
      value = (/**@type {!Object}*/value);

      // Sniff out DOM elements. We're using duck-typing instead of an
      // instanceof check since the instanceof might not always work
      // (e.g. if the value originated from another Firefox component)
      if (goog.object.containsKey(value, 'nodeType') &&
          (value['nodeType'] == goog.dom.NodeType.ELEMENT ||
           value['nodeType'] == goog.dom.NodeType.DOCUMENT)) {
        var ret = {};
        ret[bot.inject.ELEMENT_KEY] =
            bot.inject.cache.addElement((/**@type {!Element}*/value));
        return ret;
      }

      // Check if this is a Window
      if (goog.object.containsKey(value, 'document')) {
        var ret = {};
        ret[bot.inject.WINDOW_KEY] =
            bot.inject.cache.addElement((/**@type{!Window}*/value));
        return ret;
      }

      if (goog.isArrayLike(value)) {
        return goog.array.map((/**@type {goog.array.ArrayLike}*/value),
            bot.inject.wrapValue);
      }

      var filtered = goog.object.filter(value, function(val, key) {
        return goog.isNumber(key) || goog.isString(key);
      });
      return goog.object.map(filtered, bot.inject.wrapValue);

    default:  // goog.typeOf(value) == 'undefined' || 'null'
      return null;
  }
};


/**
 * Unwraps any DOM element's encoded in the given {@code value}.
 * @param {*} value The value to unwrap.
 * @param {Document=} opt_doc The document whose cache to retrieve wrapped
 *     elements from. Defaults to the current document.
 * @return {*} The unwrapped value.
 * @private
 */
bot.inject.unwrapValue_ = function(value, opt_doc) {
  if (goog.isArray(value)) {
    return goog.array.map((/**@type {goog.array.ArrayLike}*/value),
        function(v) { return bot.inject.unwrapValue_(v, opt_doc); });
  } else if (goog.isObject(value)) {
    if (typeof value == 'function') {
      return value;
    }

    if (goog.object.containsKey(value, bot.inject.ELEMENT_KEY)) {
      return bot.inject.cache.getElement(value[bot.inject.ELEMENT_KEY],
          opt_doc);
    }

    if (goog.object.containsKey(value, bot.inject.WINDOW_KEY)) {
      return bot.inject.cache.getElement(value[bot.inject.WINDOW_KEY],
          opt_doc);
    }

    return goog.object.map(value, function(val) {
      return bot.inject.unwrapValue_(val, opt_doc);
    });
  }
  return value;
};


/**
 * Recompiles {@code fn} in the context of another window so that the
 * correct symbol table is used when the function is executed. This
 * function assumes the {@code fn} can be decompiled to its source using
 * {@code Function.prototype.toString} and that it only refers to symbols
 * defined in the target window's context.
 *
 * @param {!(Function|string)} fn Either the function that shold be
 *     recompiled, or a string defining the body of an anonymous function
 *     that should be compiled in the target window's context.
 * @param {!Window} theWindow The window to recompile the function in.
 * @return {!Function} The recompiled function.
 * @private
 */
bot.inject.recompileFunction_ = function(fn, theWindow) {
  if (goog.isString(fn)) {
    return new theWindow['Function'](fn);
  }
  return theWindow == window ? fn : new theWindow['Function'](
      'return (' + fn + ').apply(null,arguments);');
};


/**
 * Executes an injected script. This function should never be called from
 * within JavaScript itself. Instead, it is used from an external source that
 * is injecting a script for execution.
 *
 * <p/>For example, in a WebDriver Java test, one might have:
 * <pre><code>
 * Object result = ((JavascriptExecutor) driver).executeScript(
 *     "return arguments[0] + arguments[1];", 1, 2);
 * </code></pre>
 *
 * <p/>Once transmitted to the driver, this command would be injected into the
 * page for evaluation as:
 * <pre><code>
 * bot.inject.executeScript(
 *     function() {return arguments[0] + arguments[1];},
 *     [1, 2]);
 * </code></pre>
 *
 * <p/>The details of how this actually gets injected for evaluation is left
 * as an implementation detail for clients of this library.
 *
 * @param {!(Function|string)} fn Either the function to execute, or a string
 *     defining the body of an anonymous function that should be executed. This
 *     function should only contain references to symbols defined in the context
 *     of the current window.
 * @param {Array.<*>} args An array of wrapped script arguments, as defined by
 *     the WebDriver wire protocol.
 * @param {boolean=} opt_stringify Whether the result should be returned as a
 *     serialized JSON string.
 * @param {!Window=} opt_window The window in whose context the function should
 *     be invoked; defaults to the current window.
 * @return {!(string|bot.inject.Response)} The response object. If
 *     opt_stringify is true, the result will be serialized and returned in
 *     string format.
 */
bot.inject.executeScript = function(fn, args, opt_stringify, opt_window) {
  var win = opt_window || bot.getWindow();
  var ret;
  try {
    fn = bot.inject.recompileFunction_(fn, win);
    var unwrappedArgs = (/**@type {Object}*/bot.inject.unwrapValue_(args,
        win.document));
    ret = bot.inject.wrapResponse_(fn.apply(null, unwrappedArgs));
  } catch (ex) {
    ret = bot.inject.wrapError_(ex);
  }
  return opt_stringify ? goog.json.serialize(ret) : ret;
};


/**
 * Executes an injected script, which is expected to finish asynchronously
 * before the given {@code timeout}. When the script finishes or an error
 * occurs, the given {@code onDone} callback will be invoked. This callback
 * will have a single argument, a {@code bot.inject.Response} object.
 *
 * The script signals its completion by invoking a supplied callback given
 * as its last argument. The callback may be invoked with a single value.
 *
 * The script timeout event will be scheduled with the provided window,
 * ensuring the timeout is synchronized with that window's event queue.
 * Furthermore, asynchronous scripts do not work across new page loads; if an
 * "unload" event is fired on the window while an asynchronous script is
 * pending, the script will be aborted and an error will be returned.
 *
 * Like {@code bot.inject.executeScript}, this function should only be called
 * from an external source. It handles wrapping and unwrapping of input/output
 * values.
 *
 * @param {(function()|string)} fn Either the function to execute, or a string
 *     defining the body of an anonymous function that should be executed.
 * @param {Array.<*>} args An array of wrapped script arguments, as defined by
 *     the WebDriver wire protocol.
 * @param {number} timeout The amount of time, in milliseconds, the script
 *     should be permitted to run; must be non-negative.
 * @param {function(string)|function(!bot.inject.Response)} onDone
 *     The function to call when the given {@code fn} invokes its callback,
 *     or when an exception or timeout occurs. This will always be called.
 * @param {boolean=} opt_stringify Whether the result should be returned as a
 *     serialized JSON string.
 * @param {!Window=} opt_window The window to synchronize the script with;
 *     defaults to the current window.
 * @return {null} Doesn't return anything, but will call "onDone".
 */
bot.inject.executeAsyncScript = function(fn, args, timeout, onDone,
                                         opt_stringify, opt_window) {
  var win = opt_window || window;
  var timeoutId, onunloadKey;
  var responseSent = false;

  function sendResponse(status, value) {
    if (!responseSent) {
      goog.events.unlistenByKey(onunloadKey);
      win.clearTimeout(timeoutId);
      if (status != bot.ErrorCode.SUCCESS) {
        var err = new bot.Error(status, value.message || value + '');
        err.stack = value.stack;
        value = bot.inject.wrapError_(err);
      } else {
        value = bot.inject.wrapResponse_(value);
      }
      onDone(opt_stringify ? goog.json.serialize(value) : value);
      responseSent = true;
    }
  }
  var sendError = goog.partial(sendResponse, bot.ErrorCode.UNKNOWN_ERROR);

  if (win.closed) {
    return sendError('Unable to execute script; the target window is closed.');
  }

  fn = bot.inject.recompileFunction_(fn, win);

  args = /** @type {Array.<*>} */bot.inject.unwrapValue_(args, win.document);
  args.push(goog.partial(sendResponse, bot.ErrorCode.SUCCESS));

  onunloadKey = goog.events.listen(win, goog.events.EventType.UNLOAD,
      function() {
        sendResponse(bot.ErrorCode.UNKNOWN_ERROR,
            Error('Detected a page unload event; asynchronous script ' +
                  'execution does not work across page loads.'));
      }, true);

  var startTime = goog.now();
  try {
    fn.apply(win, args);

    // Register our timeout *after* the function has been invoked. This will
    // ensure we don't timeout on a function that invokes its callback after
    // a 0-based timeout.
    timeoutId = win.setTimeout(function() {
      sendResponse(bot.ErrorCode.SCRIPT_TIMEOUT,
                   Error('Timed out waiting for asyncrhonous script result ' +
                         'after ' + (goog.now() - startTime) + ' ms'));
    }, Math.max(0, timeout));
  } catch (ex) {
    sendResponse(ex.code || bot.ErrorCode.UNKNOWN_ERROR, ex);
  }
};


/**
 * Wraps the response to an injected script that executed successfully so it
 * can be JSON-ified for transmission to the process that injected this
 * script.
 * @param {*} value The script result.
 * @return {{status:bot.ErrorCode,value:*}} The wrapped value.
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#Responses
 * @private
 */
bot.inject.wrapResponse_ = function(value) {
  return {
    'status': bot.ErrorCode.SUCCESS,
    'value': bot.inject.wrapValue(value)
  };
};


/**
 * Wraps a JavaScript error in an object-literal so that it can be JSON-ified
 * for transmission to the process that injected this script.
 * @param {Error} err The error to wrap.
 * @return {{status:bot.ErrorCode,value:*}} The wrapped error object.
 * @see http://code.google.com/p/selenium/wiki/JsonWireProtocol#Failed_Commands
 * @private
 */
bot.inject.wrapError_ = function(err) {
  // TODO(user): Parse stackTrace
  return {
    'status': goog.object.containsKey(err, 'code') ?
        err['code'] : bot.ErrorCode.UNKNOWN_ERROR,
    // TODO(user): Parse stackTrace
    'value': {
      'message': err.message
    }
  };
};


/**
 * The property key used to store the element cache on the DOCUMENT node
 * when it is injected into the page. Since compiling each browser atom results
 * in a different symbol table, we must use this known key to access the cache.
 * This ensures the same object is used between injections of different atoms.
 * @type {string}
 * @const
 * @private
 */
bot.inject.cache.CACHE_KEY_ = '$wdc_';


/**
 * The prefix for each key stored in an cache.
 * @type {string}
 * @const
 */
bot.inject.cache.ELEMENT_KEY_PREFIX = ':wdc:';


/**
 * Retrieves the cache object for the given window. Will initialize the cache
 * if it does not yet exist.
 * @param {Document=} opt_doc The document whose cache to retrieve. Defaults to
 *     the current document.
 * @return {Object.<string, (Element|Window)>} The cache object.
 * @private
 */
bot.inject.cache.getCache_ = function(opt_doc) {
  var doc = opt_doc || document;
  var cache = doc[bot.inject.cache.CACHE_KEY_];
  if (!cache) {
    cache = doc[bot.inject.cache.CACHE_KEY_] = {};
    // Store the counter used for generated IDs in the cache so that it gets
    // reset whenever the cache does.
    cache.nextId = goog.now();
  }
  // Sometimes the nextId does not get initialized and returns NaN
  // TODO: Generate UID on the fly instead.
  if (!cache.nextId) {
    cache.nextId = goog.now();
  }
  return cache;
};


/**
 * Adds an element to its ownerDocument's cache.
 * @param {(Element|Window)} el The element or Window object to add.
 * @return {string} The key generated for the cached element.
 */
bot.inject.cache.addElement = function(el) {
  // Check if the element already exists in the cache.
  var cache = bot.inject.cache.getCache_(el.ownerDocument);
  var id = goog.object.findKey(cache, function(value) {
    return value == el;
  });
  if (!id) {
    id = bot.inject.cache.ELEMENT_KEY_PREFIX + cache.nextId++;
    cache[id] = el;
  }
  return id;
};


/**
 * Retrieves an element from the cache. Will verify that the element is
 * still attached to the DOM before returning.
 * @param {string} key The element's key in the cache.
 * @param {Document=} opt_doc The document whose cache to retrieve the element
 *     from. Defaults to the current document.
 * @return {Element|Window} The cached element.
 */
bot.inject.cache.getElement = function(key, opt_doc) {
  key = decodeURIComponent(key);
  var doc = opt_doc || document;
  var cache = bot.inject.cache.getCache_(doc);
  if (!goog.object.containsKey(cache, key)) {
    // Throw STALE_ELEMENT_REFERENCE instead of NO_SUCH_ELEMENT since the
    // key may have been defined by a prior document's cache.
    throw new bot.Error(bot.ErrorCode.STALE_ELEMENT_REFERENCE,
        'Element does not exist in cache');
  }

  var el = cache[key];

  // If this is a Window check if it's closed
  if (goog.object.containsKey(el, 'setInterval')) {
    if (el.closed) {
      delete cache[key];
      throw new bot.Error(bot.ErrorCode.NO_SUCH_WINDOW,
          'Window has been closed.');
    }
    return el;
  }

  // Make sure the element is still attached to the DOM before returning.
  var node = el;
  while (node) {
    if (node == doc.documentElement) {
      return el;
    }
    node = node.parentNode;
  }
  delete cache[key];
  throw new bot.Error(bot.ErrorCode.STALE_ELEMENT_REFERENCE,
      'Element is no longer attached to the DOM');
};

// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview The file contains an abstraction of a keyboad
 * for simulating the presing and releasing of keys.
 */

goog.provide('bot.Keyboard');
goog.provide('bot.Keyboard.Key');
goog.provide('bot.Keyboard.Keys');

goog.require('bot.Device');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('bot.dom');
goog.require('bot.events.EventType');
goog.require('goog.array');
goog.require('goog.dom.selection');
goog.require('goog.events.KeyCodes');
goog.require('goog.structs.Set');
goog.require('goog.userAgent');



/**
 * A keyboard that provides atomic typing actions.
 *
 * @constructor
 * @extends {bot.Device}
 */
bot.Keyboard = function() {
  goog.base(this);

  /**
   * @type {boolean}
   * @private
   */
  this.editable_ = bot.dom.isEditable(this.getElement());

  /**
   * @type {!goog.structs.Set.<!bot.Keyboard.Key>}
   * @private
   */
  this.pressed_ = new goog.structs.Set();
};
goog.inherits(bot.Keyboard, bot.Device);


/**
 * Maps characters to (key,boolean) pairs, where the key generates the
 * character and the boolean is true when the shift must be pressed.
 *
 * @type {!Object.<string, {key: !bot.Keyboard.Key, shift: boolean}>}
 * @const
 * @private
 */
bot.Keyboard.CHAR_TO_KEY_ = {};


/**
 * Constructs a new key and, if it is a character key, adds a mapping from the
 * character to is in the CHAR_TO_KEY_ map. Using this factory function instead
 * of the new keyword, also helps reduce the size of the compiled Js fragment.
 *
 * @param {?number|{gecko: ?number, ieWebkit: ?number, opera: ?number}} code
 *     Either a single keycode or a record of per-browser keycodes.
 * @param {string=} opt_char Character when shift is not pressed.
 * @param {string=} opt_shiftChar Character when shift is pressed.
 * @return {!bot.Keyboard.Key} The new key.
 * @private
 */
bot.Keyboard.newKey_ = function(code, opt_char, opt_shiftChar) {
  if (goog.isObject(code)) {
    if (goog.userAgent.GECKO) {
      code = code.gecko;
    } else if (goog.userAgent.OPERA) {
      code = code.opera;
    } else {  // IE and Webkit
      code = code.ieWebkit;
    }
  }
  var key = new bot.Keyboard.Key(code, opt_char, opt_shiftChar);

  // For a character key, potentially map the character to the key in the
  // CHAR_TO_KEY_ map. Because of numpad, multiple keys may have the same
  // character. To avoid mapping numpad keys, we overwrite a mapping only if
  // the key has a distinct shift character.
  if (opt_char && (!(opt_char in bot.Keyboard.CHAR_TO_KEY_) || opt_shiftChar)) {
    bot.Keyboard.CHAR_TO_KEY_[opt_char] = {key: key, shift: false};
    if (opt_shiftChar) {
      bot.Keyboard.CHAR_TO_KEY_[opt_shiftChar] = {key: key, shift: true};
    }
  }

  return key;
};



/**
 * A key on the keyboard.
 *
 * @constructor
 * @param {?number} code Keycode for the key; null for the (rare) case
 *     that pressing the key issues no key events.
 * @param {string=} opt_char Character when shift is not pressed; null
 *     when the key does not cause a character to be typed.
 * @param {string=} opt_shiftChar Character when shift is pressed; null
 *     when the key does not cause a character to be typed.
 */
bot.Keyboard.Key = function(code, opt_char, opt_shiftChar) {
  /** @type {?number} */
  this.code = code;

  /** @type {?string} */
  this.character = opt_char || null;

  /** @type {?string} */
  this.shiftChar = opt_shiftChar || this.character;
};


/**
 * An enumeration of keys known to this module.
 *
 * @enum {!bot.Keyboard.Key}
 */
bot.Keyboard.Keys = {
  BACKSPACE: bot.Keyboard.newKey_(8),
  TAB: bot.Keyboard.newKey_(9),
  ENTER: bot.Keyboard.newKey_(13),
  SHIFT: bot.Keyboard.newKey_(16),
  CONTROL: bot.Keyboard.newKey_(17),
  ALT: bot.Keyboard.newKey_(18),
  PAUSE: bot.Keyboard.newKey_(19),
  CAPS_LOCK: bot.Keyboard.newKey_(20),
  ESC: bot.Keyboard.newKey_(27),
  SPACE: bot.Keyboard.newKey_(32, ' '),
  PAGE_UP: bot.Keyboard.newKey_(33),
  PAGE_DOWN: bot.Keyboard.newKey_(34),
  END: bot.Keyboard.newKey_(35),
  HOME: bot.Keyboard.newKey_(36),
  LEFT: bot.Keyboard.newKey_(37),
  UP: bot.Keyboard.newKey_(38),
  RIGHT: bot.Keyboard.newKey_(39),
  DOWN: bot.Keyboard.newKey_(40),
  PRINT_SCREEN: bot.Keyboard.newKey_(44),
  INSERT: bot.Keyboard.newKey_(45),
  DELETE: bot.Keyboard.newKey_(46),

  // Number keys
  ZERO: bot.Keyboard.newKey_(48, '0', ')'),
  ONE: bot.Keyboard.newKey_(49, '1', '!'),
  TWO: bot.Keyboard.newKey_(50, '2', '@'),
  THREE: bot.Keyboard.newKey_(51, '3', '#'),
  FOUR: bot.Keyboard.newKey_(52, '4', '$'),
  FIVE: bot.Keyboard.newKey_(53, '5', '%'),
  SIX: bot.Keyboard.newKey_(54, '6', '^'),
  SEVEN: bot.Keyboard.newKey_(55, '7', '&'),
  EIGHT: bot.Keyboard.newKey_(56, '8', '*'),
  NINE: bot.Keyboard.newKey_(57, '9', '('),

  // Letter keys
  A: bot.Keyboard.newKey_(65, 'a', 'A'),
  B: bot.Keyboard.newKey_(66, 'b', 'B'),
  C: bot.Keyboard.newKey_(67, 'c', 'C'),
  D: bot.Keyboard.newKey_(68, 'd', 'D'),
  E: bot.Keyboard.newKey_(69, 'e', 'E'),
  F: bot.Keyboard.newKey_(70, 'f', 'F'),
  G: bot.Keyboard.newKey_(71, 'g', 'G'),
  H: bot.Keyboard.newKey_(72, 'h', 'H'),
  I: bot.Keyboard.newKey_(73, 'i', 'I'),
  J: bot.Keyboard.newKey_(74, 'j', 'J'),
  K: bot.Keyboard.newKey_(75, 'k', 'K'),
  L: bot.Keyboard.newKey_(76, 'l', 'L'),
  M: bot.Keyboard.newKey_(77, 'm', 'M'),
  N: bot.Keyboard.newKey_(78, 'n', 'N'),
  O: bot.Keyboard.newKey_(79, 'o', 'O'),
  P: bot.Keyboard.newKey_(80, 'p', 'P'),
  Q: bot.Keyboard.newKey_(81, 'q', 'Q'),
  R: bot.Keyboard.newKey_(82, 'r', 'R'),
  S: bot.Keyboard.newKey_(83, 's', 'S'),
  T: bot.Keyboard.newKey_(84, 't', 'T'),
  U: bot.Keyboard.newKey_(85, 'u', 'U'),
  V: bot.Keyboard.newKey_(86, 'v', 'V'),
  W: bot.Keyboard.newKey_(87, 'w', 'W'),
  X: bot.Keyboard.newKey_(88, 'x', 'X'),
  Y: bot.Keyboard.newKey_(89, 'y', 'Y'),
  Z: bot.Keyboard.newKey_(90, 'z', 'Z'),

  // Branded keys
  META: bot.Keyboard.newKey_(
      goog.userAgent.WINDOWS ? {gecko: 91, ieWebkit: 91, opera: 219} :
          (goog.userAgent.MAC ? {gecko: 224, ieWebkit: 91, opera: 17} :
              {gecko: 0, ieWebkit: 91, opera: null})),  // Linux
  META_RIGHT: bot.Keyboard.newKey_(
      goog.userAgent.WINDOWS ? {gecko: 92, ieWebkit: 92, opera: 220} :
          (goog.userAgent.MAC ? {gecko: 224, ieWebkit: 93, opera: 17} :
              {gecko: 0, ieWebkit: 92, opera: null})),  // Linux
  CONTEXT_MENU: bot.Keyboard.newKey_(
      goog.userAgent.WINDOWS ? {gecko: 93, ieWebkit: 93, opera: 0} :
          (goog.userAgent.MAC ? {gecko: 0, ieWebkit: 0, opera: 16} :
              {gecko: 93, ieWebkit: null, opera: 0})),  // Linux

  // Numpad keys
  NUM_ZERO: bot.Keyboard.newKey_({gecko: 96, ieWebkit: 96, opera: 48}, '0'),
  NUM_ONE: bot.Keyboard.newKey_({gecko: 97, ieWebkit: 97, opera: 49}, '1'),
  NUM_TWO: bot.Keyboard.newKey_({gecko: 98, ieWebkit: 98, opera: 50}, '2'),
  NUM_THREE: bot.Keyboard.newKey_({gecko: 99, ieWebkit: 99, opera: 51}, '3'),
  NUM_FOUR: bot.Keyboard.newKey_({gecko: 100, ieWebkit: 100, opera: 52}, '4'),
  NUM_FIVE: bot.Keyboard.newKey_({gecko: 101, ieWebkit: 101, opera: 53}, '5'),
  NUM_SIX: bot.Keyboard.newKey_({gecko: 102, ieWebkit: 102, opera: 54}, '6'),
  NUM_SEVEN: bot.Keyboard.newKey_({gecko: 103, ieWebkit: 103, opera: 55}, '7'),
  NUM_EIGHT: bot.Keyboard.newKey_({gecko: 104, ieWebkit: 104, opera: 56}, '8'),
  NUM_NINE: bot.Keyboard.newKey_({gecko: 105, ieWebkit: 105, opera: 57}, '9'),
  NUM_MULTIPLY: bot.Keyboard.newKey_(
      {gecko: 106, ieWebkit: 106, opera: goog.userAgent.LINUX ? 56 : 42}, '*'),
  NUM_PLUS: bot.Keyboard.newKey_(
      {gecko: 107, ieWebkit: 107, opera: goog.userAgent.LINUX ? 61 : 43}, '+'),
  NUM_MINUS: bot.Keyboard.newKey_(
      {gecko: 109, ieWebkit: 109, opera: goog.userAgent.LINUX ? 109 : 45}, '-'),
  NUM_PERIOD: bot.Keyboard.newKey_(
      {gecko: 110, ieWebkit: 110, opera: goog.userAgent.LINUX ? 190 : 78}, '.'),
  NUM_DIVISION: bot.Keyboard.newKey_(
      {gecko: 111, ieWebkit: 111, opera: goog.userAgent.LINUX ? 191 : 47}, '/'),
  NUM_LOCK: bot.Keyboard.newKey_(
      (goog.userAgent.LINUX && goog.userAgent.OPERA) ? null : 144),

  // Function keys
  F1: bot.Keyboard.newKey_(112),
  F2: bot.Keyboard.newKey_(113),
  F3: bot.Keyboard.newKey_(114),
  F4: bot.Keyboard.newKey_(115),
  F5: bot.Keyboard.newKey_(116),
  F6: bot.Keyboard.newKey_(117),
  F7: bot.Keyboard.newKey_(118),
  F8: bot.Keyboard.newKey_(119),
  F9: bot.Keyboard.newKey_(120),
  F10: bot.Keyboard.newKey_(121),
  F11: bot.Keyboard.newKey_(122),
  F12: bot.Keyboard.newKey_(123),

  // Punctuation keys
  EQUALS: bot.Keyboard.newKey_(
      {gecko: 107, ieWebkit: 187, opera: 61}, '=', '+'),
  HYPHEN: bot.Keyboard.newKey_(
      {gecko: 109, ieWebkit: 189, opera: 109}, '-', '_'),
  COMMA: bot.Keyboard.newKey_(188, ',', '<'),
  PERIOD: bot.Keyboard.newKey_(190, '.', '>'),
  SLASH: bot.Keyboard.newKey_(191, '/', '?'),
  BACKTICK: bot.Keyboard.newKey_(192, '`', '~'),
  OPEN_BRACKET: bot.Keyboard.newKey_(219, '[', '{'),
  BACKSLASH: bot.Keyboard.newKey_(220, '\\', '|'),
  CLOSE_BRACKET: bot.Keyboard.newKey_(221, ']', '}'),
  SEMICOLON: bot.Keyboard.newKey_(
      {gecko: 59, ieWebkit: 186, opera: 59}, ';', ':'),
  APOSTROPHE: bot.Keyboard.newKey_(222, '\'', '"')
};


/**
 * Given a character, returns a pair of a key and a boolean: the key being one
 * that types the character and the boolean indicating whether the key must be
 * shifted to type it. This function will never return a numpad key; that is,
 * it will always return a symbol key when given a number or math symbol.
 *
 * If given a character for which this module does not know the key (the key
 * is not in the bot.Keyboard.Keys enumeration), returns a key that types the
 * given character but has a (likely incorrect) keycode of zero.
 *
 * @param {string} ch Single character.
 * @return {{key: !bot.Keyboard.Key, shift: boolean}} A pair of a key and
 *     a boolean indicating whether shift must be pressed for the character.
 */
bot.Keyboard.Key.fromChar = function(ch) {
  if (ch.length != 1) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
                        'Argument not a single character: ' + ch);
  }
  var keyShiftPair = bot.Keyboard.CHAR_TO_KEY_[ch];
  if (!keyShiftPair) {
    // We don't know the true keycode of non-US keyboard characters, but
    // ch.toUpperCase().charCodeAt(0) should occasionally be right, and
    // at least yield a positive number.
    var upperCase = ch.toUpperCase();
    var keyCode = upperCase.charCodeAt(0);
    var key = bot.Keyboard.newKey_(keyCode, ch.toLowerCase(), upperCase);
    keyShiftPair = {key: key, shift: (ch != key.character)};
  }
  return keyShiftPair;
};


/**
 * Array of modifier keys.
 *
 * @type {!Array.<bot.Keyboard.Key>}
 * @const
 */
bot.Keyboard.MODIFIERS = [
  bot.Keyboard.Keys.ALT,
  bot.Keyboard.Keys.CONTROL,
  bot.Keyboard.Keys.META,
  bot.Keyboard.Keys.SHIFT
];


/**
 * The value used for newlines in the current browser/OS combination. Although
 * the line endings look platform dependent, they are browser dependent. In
 * particular, Opera uses \r\n on all platforms.
 * @type {string}
 * @private
 * @const
 */
bot.Keyboard.NEW_LINE_ =
    goog.userAgent.IE || goog.userAgent.OPERA ? '\r\n' : '\n';


/**
 * Returns whether the key is currently pressed.
 *
 * @param {bot.Keyboard.Key} key Key.
 * @return {boolean} Whether the key is pressed.
 */
bot.Keyboard.prototype.isPressed = function(key) {
  return this.pressed_.contains(key);
};


/**
 * Presses the given key on the keyboard. Keys that are pressed can be pressed
 * again before releasing, to simulate repeated keys, except for modifier keys,
 * which must be released before they can be pressed again.
 *
 * @param {!bot.Keyboard.Key} key Key to press.
 */
bot.Keyboard.prototype.pressKey = function(key) {
  if (this.isPressed(key) && goog.array.contains(bot.Keyboard.MODIFIERS, key)) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Cannot press a modifier key that is already pressed.');
  }

  // Note that GECKO is special-cased below because of
  // https://bugzilla.mozilla.org/show_bug.cgi?id=501496. "preventDefault on
  // keydown does not cancel following keypress"
  var performDefault = !goog.isNull(key.code) &&
      this.fireKeyEvent_(bot.events.EventType.KEYDOWN, key);

  // Fires keydown and stops if unsuccessful.
  if (performDefault || goog.userAgent.GECKO) {
    // Fires keypress if required and stops if unsuccessful.
    if (!this.requiresKeyPress_(key) ||
        this.fireKeyEvent_(
            bot.events.EventType.KEYPRESS, key, !performDefault)) {
      if (performDefault) {
        this.maybeSubmitForm_(key);
        if (this.editable_) {
          this.maybeEditText_(key);
        }
      }
    }
  }

  this.pressed_.add(key);
};


/**
 * Whether the given key currently requires a keypress.
 * TODO(user): Make this dependent on the state of the modifier keys.
 *
 * @param {bot.Keyboard.Key} key Key.
 * @return {boolean} Whether it requires a keypress event.
 * @private
 */
bot.Keyboard.prototype.requiresKeyPress_ = function(key) {
  if (key.character || key == bot.Keyboard.Keys.ENTER) {
    return true;
  } else if (goog.userAgent.WEBKIT) {
    return false;
  } else if (goog.userAgent.IE) {
    return key == bot.Keyboard.Keys.ESC;
  } else { // Gecko and Opera
    switch (key) {
      case bot.Keyboard.Keys.SHIFT:
      case bot.Keyboard.Keys.CONTROL:
      case bot.Keyboard.Keys.ALT:
        return false;
      case bot.Keyboard.Keys.META:
      case bot.Keyboard.Keys.META_RIGHT:
      case bot.Keyboard.Keys.CONTEXT_MENU:
        return goog.userAgent.GECKO;
      default:
        return true;
    }
  }
};


/**
 * Maybe submit a form if the ENTER key is released.  On non-FF browsers, firing
 * the keyPress and keyRelease events for the ENTER key does not result in a
 * form being submitted so we have to fire the form submit event as well.
 *
 * @param {bot.Keyboard.Key} key Key.
 * @private
 */
bot.Keyboard.prototype.maybeSubmitForm_ = function(key) {
  if (key != bot.Keyboard.Keys.ENTER) {
    return;
  }
  if (goog.userAgent.GECKO ||
      !bot.dom.isElement(this.getElement(), goog.dom.TagName.INPUT)) {
    return;
  }

  var form = bot.Device.findAncestorForm(this.getElement());
  if (form) {
    var inputs = form.getElementsByTagName('input');
    var hasSubmit = goog.array.some(inputs, function(e) {
      return bot.Device.isFormSubmitElement(e);
    });
    // The second part of this if statement will always include forms on Safari
    // version < 5.
    if (hasSubmit || inputs.length == 1 ||
        (goog.userAgent.WEBKIT && !bot.userAgent.isEngineVersion(534))) {
      this.submitForm(form);
    }
  }
};


/**
 * Maybe edit text when a key is pressed in an editable form.
 *
 * @param {!bot.Keyboard.Key} key Key that was pressed.
 * @private
 */
bot.Keyboard.prototype.maybeEditText_ = function(key) {
  if (key.character) {
    this.updateOnCharacter_(key);
  } else {
    switch (key) {
      case bot.Keyboard.Keys.ENTER:
        this.updateOnEnter_();
        break;
      case bot.Keyboard.Keys.BACKSPACE:
      case bot.Keyboard.Keys.DELETE:
        this.updateOnBackspaceOrDelete_(key);
        break;
      case bot.Keyboard.Keys.LEFT:
      case bot.Keyboard.Keys.RIGHT:
        this.updateOnLeftOrRight_(key);
        break;
    }
  }
};


/**
 * Releases the given key on the keyboard. Releasing a key that is not
 * pressed results in an exception.
 *
 * @param {!bot.Keyboard.Key} key Key to release.
 */
bot.Keyboard.prototype.releaseKey = function(key) {
  if (!this.isPressed(key)) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Cannot release a key that is not pressed.');
  }
  if (!goog.isNull(key.code)) {
    this.fireKeyEvent_(bot.events.EventType.KEYUP, key);
  }
  this.pressed_.remove(key);
};


/**
 * Given the current state of the SHIFT and CAPS_LOCK key, returns the
 * character that will be typed is the specified key is pressed.
 *
 * @param {!bot.Keyboard.Key} key Key.
 * @return {string} Character to be typed.
 * @private
 */
bot.Keyboard.prototype.getChar_ = function(key) {
  if (!key.character) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR, 'not a character key');
  }
  var shiftPressed = this.isPressed(bot.Keyboard.Keys.SHIFT);
  return /** @type {string} */ (shiftPressed ? key.shiftChar : key.character);
};


/**
 * @param {!bot.Keyboard.Key} key Key with character to insert.
 * @private
 */
bot.Keyboard.prototype.updateOnCharacter_ = function(key) {
  // Gecko updates the element as a result of the keypress.
  if (goog.userAgent.GECKO) {
    return;
  }

  var character = this.getChar_(key);
  goog.dom.selection.setText(this.getElement(), character);
  goog.dom.selection.setStart(this.getElement(),
      goog.dom.selection.getStart(this.getElement()) + 1);
  if (goog.userAgent.WEBKIT) {
    this.fireHtmlEvent(bot.events.EventType.TEXTINPUT);
  }
  if (!bot.userAgent.IE_DOC_PRE9) {
    this.fireHtmlEvent(bot.events.EventType.INPUT);
  }
};


/**
 * @private
 */
bot.Keyboard.prototype.updateOnEnter_ = function() {
  // Gecko updates the element as a result of the keypress.
  if (goog.userAgent.GECKO) {
    return;
  }

  // WebKit fires text input regardless of whether a new line is added, see:
  // https://bugs.webkit.org/show_bug.cgi?id=54152
  if (goog.userAgent.WEBKIT) {
    this.fireHtmlEvent(bot.events.EventType.TEXTINPUT);
  }
  if (bot.dom.isElement(this.getElement(), goog.dom.TagName.TEXTAREA)) {
    goog.dom.selection.setText(this.getElement(), bot.Keyboard.NEW_LINE_);
    goog.dom.selection.setStart(this.getElement(),
        goog.dom.selection.getStart(this.getElement()) +
        bot.Keyboard.NEW_LINE_.length);
    if (!goog.userAgent.IE) {
      this.fireHtmlEvent(bot.events.EventType.INPUT);
    }
  }
};


/**
 * @param {!bot.Keyboard.Key} key Backspace or delete key.
 * @private
 */
bot.Keyboard.prototype.updateOnBackspaceOrDelete_ = function(key) {
  // Gecko updates the element as a result of the keypress.
  if (goog.userAgent.GECKO) {
    return;
  }

  // Determine what should be deleted.  If text is already selected, that
  // text is deleted, else we move left/right from the current cursor.
  var endpoints = goog.dom.selection.getEndPoints(this.getElement());
  if (key == bot.Keyboard.Keys.BACKSPACE && endpoints[0] == endpoints[1]) {
    goog.dom.selection.setStart(this.getElement(), endpoints[1] - 1);
    // On IE, changing goog.dom.selection.setStart also changes the end.
    goog.dom.selection.setEnd(this.getElement(), endpoints[1]);
  } else {
    goog.dom.selection.setEnd(this.getElement(), endpoints[1] + 1);
  }

  // If the endpoints are equal (e.g., the cursor was at the beginning/end
  // of the input), the text field won't be changed.
  endpoints = goog.dom.selection.getEndPoints(this.getElement());
  var textChanged = !(endpoints[0] == this.getElement().value.length ||
                      endpoints[1] == 0);
  goog.dom.selection.setText(this.getElement(), '');

  // Except for IE and GECKO, we need to fire the input event manually, but
  // only if the text was actually changed.
  // Note: Gecko has some strange behavior with the input event.  In a
  //  textarea, backspace always sends an input event, while delete only
  //  sends one if you actually change the text.
  //  In a textbox/password box, backspace always sends an input event unless
  //  the box has no text.  Delete behaves the same way in Firefox 3.0, but
  //  in later versions it only fires an input event if no text changes.
  if (!goog.userAgent.IE && textChanged) {
    this.fireHtmlEvent(bot.events.EventType.INPUT);
  }
};


/**
 * @param {!bot.Keyboard.Key} key Special key to press.
 * @private
 */
bot.Keyboard.prototype.updateOnLeftOrRight_ = function(key) {
  var start = goog.dom.selection.getStart(this.getElement());
  if (key == bot.Keyboard.Keys.LEFT) {
    goog.dom.selection.setCursorPosition(this.getElement(), start - 1);
  } else {  // (key == bot.Keyboard.Keys.RIGHT)
    goog.dom.selection.setCursorPosition(this.getElement(), start + 1);
  }
};


/**
 * @param {bot.events.EventType} type Event type.
 * @param {!bot.Keyboard.Key} key Key.
 * @param {boolean=} opt_preventDefault Whether the default event should be
 *     prevented. Defaults to false.
 * @return {boolean} Whether the event fired successfully or was cancelled.
 * @private
 */
bot.Keyboard.prototype.fireKeyEvent_ = function(type, key, opt_preventDefault) {
  if (goog.isNull(key.code)) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Key must have a keycode to be fired.');
  }

  var args = {
    altKey: this.isPressed(bot.Keyboard.Keys.ALT),
    ctrlKey: this.isPressed(bot.Keyboard.Keys.CONTROL),
    metaKey: this.isPressed(bot.Keyboard.Keys.META),
    shiftKey: this.isPressed(bot.Keyboard.Keys.SHIFT),
    keyCode: key.code,
    charCode: (key.character && type == bot.events.EventType.KEYPRESS) ?
        this.getChar_(key).charCodeAt(0) : 0,
    preventDefault: !!opt_preventDefault
  };

  return this.fireKeyboardEvent(type, args);
};


/**
 * Sets focus to the element. If the element does not have focus, place cursor
 * at the end of the text in the element.
 *
 * @param {!Element} element Element that is moved to.
 */
bot.Keyboard.prototype.moveCursor = function(element) {
  this.setElement(element);
  this.editable_ = bot.dom.isEditable(element);

  var focusChanged = this.focusOnElement();
  if (this.editable_ && focusChanged) {
    goog.dom.selection.setCursorPosition(element, element.value.length);
  }
};
// Copyright 2011 WebDriver committers
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview The file contains an abstraction of a mouse for
 * simulating the mouse actions.
 */

goog.provide('bot.Mouse');
goog.provide('bot.Mouse.Button');

goog.require('bot');
goog.require('bot.Device');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('bot.dom');
goog.require('bot.events.EventType');
goog.require('bot.userAgent');
goog.require('goog.dom');
goog.require('goog.dom.Range');
goog.require('goog.dom.TagName');
goog.require('goog.math.Coordinate');
goog.require('goog.style');
goog.require('goog.userAgent');



/**
 * A mouse that provides atomic mouse actions. This mouse currently only
 * supports having one button pressed at a time.
 *
 * @constructor
 * @extends {bot.Device}
 */
bot.Mouse = function() {
  goog.base(this);

  /**
   * @type {?bot.Mouse.Button}
   * @private
   */
  this.buttonPressed_ = null;

  /**
   * @type {Element}
   * @private
   */
  this.elementPressed_ = null;

  /**
   * @type {!goog.math.Coordinate}
   * @private
   */
  this.clientXY_ = new goog.math.Coordinate(0, 0);

  /**
   * @type {boolean}
   * @private
   */
  this.nextClickIsDoubleClick_ = false;

  /**
   * Whether this Mouse has ever explicitly interacted with any element.
   *
   * @type {boolean}
   * @private
   */
  this.hasEverInteracted_ = false;
};
goog.inherits(bot.Mouse, bot.Device);


/**
 * Enumeration of mouse buttons that can be pressed.
 *
 * @enum {number}
 */
bot.Mouse.Button = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
};


/**
 * Index to indicate no button pressed in bot.Mouse.MOUSE_BUTTON_VALUE_MAP_.
 *
 * @type {number}
 * @private
 * @const
 */
bot.Mouse.NO_BUTTON_VALUE_INDEX_ = 3;


/**
 * Maps mouse events to an array of button argument value for each mouse button.
 * The array is indexed by the bot.Mouse.Button values. It encodes this table,
 * where each cell contains the (left/middle/right/none) button values.
 *               click/    mouseup/   mouseout/  mousemove  contextmenu
 *               dblclick/ mousedown  mouseover
 * IE_DOC_PRE9   0 0 0 X   1 4 2 X    0 0 0 0    1 4 2 0    X X 0 X
 * WEBKIT/IE9    0 1 2 X   0 1 2 X    0 1 2 0    0 1 2 0    X X 2 X
 * GECKO/OPERA   0 1 2 X   0 1 2 X    0 0 0 0    0 0 0 0    X X 2 X
 *
 * @type {!Object.<bot.events.EventType, !Array.<?number>>}
 * @private
 * @const
 */
bot.Mouse.MOUSE_BUTTON_VALUE_MAP_ = (function() {
  // EventTypes can safely be used as keys without collisions in a JS Object,
  // because its toString method returns a unique string (the event type name).
  var buttonValueMap = {};
  if (bot.userAgent.IE_DOC_PRE9) {
    buttonValueMap[bot.events.EventType.CLICK] = [0, 0, 0, null];
    buttonValueMap[bot.events.EventType.CONTEXTMENU] = [null, null, 0, null];
    buttonValueMap[bot.events.EventType.MOUSEUP] = [1, 4, 2, null];
    buttonValueMap[bot.events.EventType.MOUSEOUT] = [0, 0, 0, 0];
    buttonValueMap[bot.events.EventType.MOUSEMOVE] = [1, 4, 2, 0];
  } else if (goog.userAgent.WEBKIT || bot.userAgent.IE_DOC_9) {
    buttonValueMap[bot.events.EventType.CLICK] = [0, 1, 2, null];
    buttonValueMap[bot.events.EventType.CONTEXTMENU] = [null, null, 2, null];
    buttonValueMap[bot.events.EventType.MOUSEUP] = [0, 1, 2, null];
    buttonValueMap[bot.events.EventType.MOUSEOUT] = [0, 1, 2, 0];
    buttonValueMap[bot.events.EventType.MOUSEMOVE] = [0, 1, 2, 0];
  } else {
    buttonValueMap[bot.events.EventType.CLICK] = [0, 1, 2, null];
    buttonValueMap[bot.events.EventType.CONTEXTMENU] = [null, null, 2, null];
    buttonValueMap[bot.events.EventType.MOUSEUP] = [0, 1, 2, null];
    buttonValueMap[bot.events.EventType.MOUSEOUT] = [0, 0, 0, 0];
    buttonValueMap[bot.events.EventType.MOUSEMOVE] = [0, 0, 0, 0];
  }

  buttonValueMap[bot.events.EventType.DBLCLICK] =
      buttonValueMap[bot.events.EventType.CLICK];
  buttonValueMap[bot.events.EventType.MOUSEDOWN] =
      buttonValueMap[bot.events.EventType.MOUSEUP];
  buttonValueMap[bot.events.EventType.MOUSEOVER] =
      buttonValueMap[bot.events.EventType.MOUSEOUT];
  return buttonValueMap;
})();


/**
 * Attempts to fire a mousedown event and then returns whether or not the
 * element should receive focus as a result of the mousedown.
 *
 * @return {boolean} Whether to focus on the element after the mousedown.
 * @private
 */
bot.Mouse.prototype.fireMousedown_ = function() {
  // On some browsers, a mouse down event on an OPTION or SELECT element cause
  // the SELECT to open, blocking further JS execution. This is undesirable,
  // and so needs to be detected. We always focus in this case.
  // TODO(simon): This is a nasty way to avoid locking the browser
  var isFirefox3 = goog.userAgent.GECKO && !bot.userAgent.isProductVersion(4);
  var blocksOnMousedown = (goog.userAgent.WEBKIT || isFirefox3) &&
      (bot.dom.isElement(this.getElement(), goog.dom.TagName.OPTION) ||
       bot.dom.isElement(this.getElement(), goog.dom.TagName.SELECT));
  if (blocksOnMousedown) {
    return true;
  }

  // On some browsers, if the mousedown event handler makes a focus() call to
  // change the active element, this preempts the focus that would happen by
  // default on the mousedown, so we should not explicitly focus in this case.
  var beforeActiveElement;
  var mousedownCanPreemptFocus = goog.userAgent.GECKO || goog.userAgent.IE;
  if (mousedownCanPreemptFocus) {
    beforeActiveElement = bot.dom.getActiveElement(this.getElement());
  }
  var performFocus = this.fireMouseEvent_(bot.events.EventType.MOUSEDOWN);
  if (performFocus && mousedownCanPreemptFocus &&
      beforeActiveElement != bot.dom.getActiveElement(this.getElement())) {
    return false;
  }
  return performFocus;
};


/**
 * Press a mouse button on an element that the mouse is interacting with.
 *
 * @param {!bot.Mouse.Button} button Button.
*/
bot.Mouse.prototype.pressButton = function(button) {
  if (!goog.isNull(this.buttonPressed_)) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Cannot press more then one button or an already pressed button.');
  }
  this.buttonPressed_ = button;
  this.elementPressed_ = this.getElement();

  var performFocus = this.fireMousedown_();
  if (performFocus) {
    this.focusOnElement();
  }
};


/**
 * Releases the pressed mouse button. Throws exception if no button pressed.
 *
 */
bot.Mouse.prototype.releaseButton = function() {
  if (goog.isNull(this.buttonPressed_)) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Cannot release a button when no button is pressed.');
  }

  this.fireMouseEvent_(bot.events.EventType.MOUSEUP);

  // TODO(user): Middle button can also trigger click.
  if (this.buttonPressed_ == bot.Mouse.Button.LEFT &&
      this.getElement() == this.elementPressed_) {
    this.clickElement(this.clientXY_,
        this.getButtonValue_(bot.events.EventType.CLICK));
    this.maybeDoubleClickElement_();

  // TODO(user): In Linux, this fires after mousedown event.
  } else if (this.buttonPressed_ == bot.Mouse.Button.RIGHT) {
    this.fireMouseEvent_(bot.events.EventType.CONTEXTMENU);
  }
  this.buttonPressed_ = null;
  this.elementPressed_ = null;
};


/**
 * A helper function to fire mouse double click events.
 *
 * @private
 */
bot.Mouse.prototype.maybeDoubleClickElement_ = function() {
  // Trigger an additional double click event if it is the second click.
  if (this.nextClickIsDoubleClick_) {
    this.fireMouseEvent_(bot.events.EventType.DBLCLICK);
  }
  this.nextClickIsDoubleClick_ = !this.nextClickIsDoubleClick_;
};


/**
 * Given a coordinates (x,y) related to an element, move mouse to (x,y) of the
 * element. The top-left point of the element is (0,0).
 *
 * @param {!Element} element The destination element.
 * @param {!goog.math.Coordinate} coords Mouse position related to the target.
 */
bot.Mouse.prototype.move = function(element, coords) {
  var pos = goog.style.getClientPosition(element);
  this.clientXY_.x = coords.x + pos.x;
  this.clientXY_.y = coords.y + pos.y;

  if (element != this.getElement()) {
    // For the first mouse interaction on a page, if the mouse was over the
    // browser window, the browser will pass null as the relatedTarget for the
    // mousever event. For subsequent interactions, it will pass the
    // last-focused element. Unfortunately, we don't have anywhere to keep the
    // state of which elements have been focused across Mouse instances, so we
    // treat every Mouse initially positioned over the documentElement or body
    // as if it's on a new page. Accordingly, for complex actions (e.g.
    // drag-and-drop), a single Mouse instance should be used for the whole
    // action, to ensure the correct relatedTargets are fired for any events.
    var isRootElement =
        this.getElement() === bot.getDocument().documentElement ||
        this.getElement() === bot.getDocument().body;
    var prevElement =
        (!this.hasEverInteracted_ && isRootElement) ? null : this.getElement();

    this.fireMouseEvent_(bot.events.EventType.MOUSEOUT, element);
    this.setElement(element);
    this.fireMouseEvent_(bot.events.EventType.MOUSEOVER, prevElement);
  }

  this.fireMouseEvent_(bot.events.EventType.MOUSEMOVE);

  this.nextClickIsDoubleClick_ = false;
};


/**
 * Scrolls the wheel of the mouse by the given number of ticks, where a positive
 * number indicates a downward scroll and a negative is upward scroll.
 *
 * @param {number} ticks Number of ticks to scroll the mouse wheel.
 */
bot.Mouse.prototype.scroll = function(ticks) {
  if (ticks == 0) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Must scroll a non-zero number of ticks.');
  }

  // The wheelDelta value for a single up-tick of the mouse wheel is 120, and
  // a single down-tick is -120. The deltas in pixels (which is only relevant
  // for Firefox) appears to be -57 and 57, respectively.
  var wheelDelta = ticks > 0 ? -120 : 120;
  var pixelDelta = ticks > 0 ? 57 : -57;

  // Browsers fire a separate event (or pair of events in Gecko) for each tick.
  for (var i = 0; i < Math.abs(ticks); i++) {
    this.fireMouseEvent_(bot.events.EventType.MOUSEWHEEL, null, wheelDelta);
    if (goog.userAgent.GECKO) {
      this.fireMouseEvent_(bot.events.EventType.MOUSEPIXELSCROLL, null,
                           pixelDelta);
    }
  }
};


/**
 * A helper function to fire mouse events.
 *
 * @param {bot.events.EventType} type Event type.
 * @param {Element=} opt_related The related element of this event.
 * @param {number=} opt_wheelDelta The wheel delta value for the event.
 * @return {boolean} Whether the event fired successfully or was cancelled.
 * @private
 */
bot.Mouse.prototype.fireMouseEvent_ = function(type, opt_related,
                                               opt_wheelDelta) {
  this.hasEverInteracted_ = true;
  return this.fireMouseEvent(type, this.clientXY_,
      this.getButtonValue_(type), opt_related, opt_wheelDelta);
};


/**
 * Given an event type and a mouse button, sets the mouse button value used
 * for that event on the current browser. The mouse button value is 0 for any
 * event not covered by bot.Mouse.MOUSE_BUTTON_VALUE_MAP_.
 *
 * @param {bot.events.EventType} eventType Type of mouse event.
 * @return {number} The mouse button ID value to the current browser.
 * @private
*/
bot.Mouse.prototype.getButtonValue_ = function(eventType) {
  if (!(eventType in bot.Mouse.MOUSE_BUTTON_VALUE_MAP_)) {
    return 0;
  }

  var buttonIndex = goog.isNull(this.buttonPressed_) ?
      bot.Mouse.NO_BUTTON_VALUE_INDEX_ : this.buttonPressed_;
  var buttonValue = bot.Mouse.MOUSE_BUTTON_VALUE_MAP_[eventType][buttonIndex];
  if (goog.isNull(buttonValue)) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Event does not permit the specified mouse button.');
  }
  return buttonValue;
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('bot.script');

goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('goog.events');
goog.require('goog.events.EventType');


/**
 * Executes a random snippet of JavaScript that defines the body of a function
 * to invoke.  When executing asynchronous scripts, all timeouts will be
 * scheduled with the window in whose context the script is invoked (this
 * ensures timeouts are in sync with that window's event queue).  Furthermore,
 * asynchronous scripts do not work across new page loads (since the JavaScript
 * context is lost); if an "unload" event is fired while an asynchronous script
 * is executing, the script will be aborted and the {@code onFailure} callback
 * will be invoked.
 *
 * @param {string} script A string defining the body of the function
 *     to invoke.
 * @param {!Array.<*>} args The list of arguments to pass to the script.
 * @param {number} timeout The amount of time, in milliseconds, the script
 *     should be permitted to run. If {@code timeout < 0}, the script will
 *     be considered synchronous and expetected to immediately return a result.
 * @param {function(*)} onSuccess The function to call if the script
 *     succeeds. The function should take a single argument: the script
 *     result.
 * @param {function(!bot.Error)} onFailure The function to call if the script
 *     fails. The function should take a single argument: a bot.Error object
 *     describing the failure.
 * @param {Window=} opt_window The window to execute the script in; defaults
 *     to the current window. Asynchronous scripts will have their timeouts
 *     scheduled with this window. Furthermore, asynchronous scripts will
 *     be aborted if this window fires an unload event.
 */
bot.script.execute = function(script, args, timeout, onSuccess, onFailure,
                              opt_window) {
  var timeoutId, onunloadKey;
  var win = opt_window || window;
  var responseSent = false;

  function sendResponse(status, value) {
    if (!responseSent) {
      responseSent = true;
      goog.events.unlistenByKey(onunloadKey);
      win.clearTimeout(timeoutId);
      if (status != bot.ErrorCode.SUCCESS) {
        var err = new bot.Error(status, value.message);
        err.stack = value.stack;
        onFailure(err);
      } else {
        onSuccess(value);
      }
    }
  }

  function onUnload() {
    sendResponse(bot.ErrorCode.JAVASCRIPT_ERROR,
                 Error('Detected a page unload event; asynchronous script ' +
                       'execution does not work across apge loads.'));
  }

  function onTimeout(startTime) {
    sendResponse(bot.ErrorCode.SCRIPT_TIMEOUT,
                 Error('Timed out waiting for asynchronous script result ' +
                       'after ' + (goog.now() - startTime) + 'ms'));
  }

  var isAsync = timeout >= 0;

  if (isAsync) {
    args.push(function(value) {
      sendResponse(bot.ErrorCode.SUCCESS, value);
    });
    onunloadKey = goog.events.listen(win, goog.events.EventType.UNLOAD,
        onUnload, true);
  }

  var startTime = goog.now();
  try {
    // Try to use the Function type belonging to the window, where available.
    var functionType = win['Function'] || Function;
    var result = new functionType(script).apply(win, args);
    if (isAsync) {
      timeoutId = win.setTimeout(goog.partial(onTimeout, startTime), timeout);
    } else {
      sendResponse(bot.ErrorCode.SUCCESS, result);
    }
  } catch (ex) {
    sendResponse(ex.code || bot.ErrorCode.JAVASCRIPT_ERROR, ex);
  }
};
// Copyright 2011 WebDriver committers
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview The file contains an abstraction of a touch screen
 * for simulating atomic touchscreen actions.
 */

goog.provide('bot.Touchscreen');

goog.require('bot');
goog.require('bot.Device');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('bot.events.EventType');
goog.require('goog.math.Coordinate');
goog.require('goog.style');
goog.require('goog.userAgent.product');



/**
 * A TouchScreen that provides atomic touch actions.  The metaphor
 * for this abstraction is a finger moving above the touchscreen that
 * can press and then release the touchscreen when specified.
 *
 * The touchscreen supports three actions: press, release, and move.
 *
 * @constructor
 * @extends {bot.Device}
 */
bot.Touchscreen = function() {
  goog.base(this);

  /**
   * @type {!goog.math.Coordinate}
   * @private
   */
  this.clientXY_ = new goog.math.Coordinate(0, 0);

  /**
   * @type {!goog.math.Coordinate}
   * @private
   */
  this.clientXY2_ = new goog.math.Coordinate(0, 0);
};
goog.inherits(bot.Touchscreen, bot.Device);


/**
 * @type {boolean}
 * @private
 */
bot.Touchscreen.prototype.hasMovedAfterPress_ = false;


/**
 * @type {number}
 * @private
 */
bot.Touchscreen.prototype.touchIdentifier_ = 0;


/**
 * @type {number}
 * @private
 */
bot.Touchscreen.prototype.touchIdentifier2_ = 0;


/**
 * @type {number}
 * @private
 */
bot.Touchscreen.prototype.touchCounter_ = 1;


/**
 * Press the touch screen.  Pressing before moving results in an exception.
 * Pressing while already pressed also results in an exception.
 *
 * @param {boolean=} opt_press2 Whether or not press the second finger during
 *     the press.  If not defined or false, only the primary finger will be
 *     pressed.
 */
bot.Touchscreen.prototype.press = function(opt_press2) {
  if (this.isPressed()) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Cannot press touchscreen when already pressed.');
  }

  this.hasMovedAfterPress_ = false;
  this.touchIdentifier_ = this.touchCounter_++;
  if (opt_press2) {
    this.touchIdentifier2_ = this.touchCounter_++;
  }

  this.fireTouchEvent_(bot.events.EventType.TOUCHSTART);
};


/**
 * Releases an element on a touchscreen.  Releasing an element that is not
 * pressed results in an exception.
 */
bot.Touchscreen.prototype.release = function() {
  if (!this.isPressed()) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Cannot release touchscreen when not already pressed.');
  }

  this.fireTouchEvent_(bot.events.EventType.TOUCHEND);

  // If no movement occurred since press, TouchScreen.Release will fire the
  // legacy mouse events: mousemove, mousedown, mouseup, and click
  // after the touch events have been fired. The click button should be zero
  // and only one mousemove should fire.
  if (!this.hasMovedAfterPress_) {
    this.fireMouseEvent(bot.events.EventType.MOUSEMOVE, this.clientXY_, 0);
    var performFocus = this.fireMouseEvent(bot.events.EventType.MOUSEDOWN,
                                           this.clientXY_, 0);
    // Element gets focus after the mousedown event only if the mousedown was
    // not cancelled.
    if (performFocus) {
      this.focusOnElement();
    }

    this.fireMouseEvent(bot.events.EventType.MOUSEUP, this.clientXY_, 0);

    // Special click logic to follow links and to perform form actions.
    this.clickElement(this.clientXY_, /* button value */ 0);
  }
  this.touchIdentifier_ = 0;
  this.touchIdentifier2_ = 0;
};


/**
 * Moves finger along the touchscreen.
 *
 * @param {!Element} element Element that is being pressed.
 * @param {!goog.math.Coordinate} coords Coordinates relative to
 *   currentElement.
 * @param {goog.math.Coordinate=} opt_coords2 Coordinates relative to
 *   currentElement.
 */
bot.Touchscreen.prototype.move = function(element, coords, opt_coords2) {
  // The target element for touch actions is the original element. Hence, the
  // element is set only when the touchscreen is not currently being pressed.
  if (!this.isPressed()) {
    this.setElement(element);
  }

  var pos = goog.style.getClientPosition(element);
  this.clientXY_.x = coords.x + pos.x;
  this.clientXY_.y = coords.y + pos.y;

  if (goog.isDef(opt_coords2)) {
    this.clientXY2_.x = opt_coords2.x + pos.x;
    this.clientXY2_.y = opt_coords2.y + pos.y;
  }

  if (this.isPressed()) {
    this.hasMovedAfterPress_ = true;
    this.fireTouchEvent_(bot.events.EventType.TOUCHMOVE);
  }
};


/**
 * Returns whether the touchscreen is currently pressed.
 *
 * @return {boolean} Whether the touchscreen is pressed.
 */
bot.Touchscreen.prototype.isPressed = function() {
  return !!this.touchIdentifier_;
};


/**
 * A helper function to fire touch events.
 *
 * @param {bot.events.EventType} type Event type.
 * @return {boolean} Whether the event fired successfully or was cancelled.
 * @private
 */
bot.Touchscreen.prototype.fireTouchEvent_ = function(type) {
  if (!this.isPressed()) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Should never fire event when touchscreen is not pressed.');
  }
  var touchIdentifier2;
  var coords2;
  if (this.touchIdentifier2_) {
    touchIdentifier2 = this.touchIdentifier2_;
    coords2 = this.clientXY2_;
  }
  return this.fireTouchEvent(type, this.touchIdentifier_, this.clientXY_,
                             touchIdentifier2, coords2);
};
// Copyright 2011 WebDriver committers
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Similar to goog.userAgent.isVersion, but with support for
 * getting the version information when running in a firefox extension.
 */
goog.provide('bot.userAgent');

goog.require('goog.string');
goog.require('goog.userAgent');
goog.require('goog.userAgent.product');
goog.require('goog.userAgent.product.isVersion');


/**
 * Whether the rendering engine version of the current browser is equal to or
 * greater than the given version. This implementation differs from
 * goog.userAgent.isVersion in the following ways:
 * <ol>
 * <li>in a Firefox extension, tests the engine version through the XUL version
 *     comparator service, because no window.navigator object is available
 * <li>in IE, compares the given version to the current documentMode
 * </ol>
 *
 * @param {string|number} version The version number to check.
 * @return {boolean} Whether the browser engine version is the same or higher
 *     than the given version.
 */
bot.userAgent.isEngineVersion = function(version) {
  if (bot.userAgent.FIREFOX_EXTENSION) {
    return bot.userAgent.FIREFOX_EXTENSION_IS_ENGINE_VERSION_(version);
  } else if (goog.userAgent.IE) {
    return goog.string.compareVersions(document.documentMode, version) >= 0;
  } else {
    return goog.userAgent.isVersion(version);
  }
};


/**
 * Whether the product version of the current browser is equal to or greater
 * than the given version. This implementation differs from
 * goog.userAgent.product.isVersion in the following ways:
 * <ol>
 * <li>in a Firefox extension, tests the product version through the XUL version
 *     comparator service, because no window.navigator object is available
 * <li>on Android, always compares to the version to the OS version
 * </ol>
 *
 * @param {string|number} version The version number to check.
 * @return {boolean} Whether the browser product version is the same or higher
 *     than the given version.
 */
bot.userAgent.isProductVersion = function(version) {
  if (bot.userAgent.FIREFOX_EXTENSION) {
    return bot.userAgent.FIREFOX_EXTENSION_IS_PRODUCT_VERSION_(version);
  } else if (goog.userAgent.product.ANDROID) {
    return goog.string.compareVersions(
        bot.userAgent.ANDROID_VERSION_, version) >= 0;
  } else {
    return goog.userAgent.product.isVersion(version);
  }
};


/**
 * When we are in a Firefox extension, this is a function that accepts a version
 * and returns whether the version of Gecko we are on is the same or higher
 * than the given version. When we are not in a Firefox extension, this is null.
 *
 * @type {?function((string|number)): boolean}
 * @private
 */
bot.userAgent.FIREFOX_EXTENSION_IS_ENGINE_VERSION_ = null;


/**
 * When we are in a Firefox extension, this is a function that accepts a version
 * and returns whether the version of Firefox we are on is the same or higher
 * than the given version. When we are not in a Firefox extension, this is null.
 *
 * @type {?function((string|number)): boolean}
 * @private
 */
bot.userAgent.FIREFOX_EXTENSION_IS_PRODUCT_VERSION_ = null;


/**
 * Whether we are in a Firefox extension.
 *
 * @const
 * @type {boolean}
 */
bot.userAgent.FIREFOX_EXTENSION = (function() {
  // False if this browser is not a Gecko browser.
  if (!goog.userAgent.GECKO) {
    return false;
  }

  // False if this code isn't running in an extension.
  var Components = goog.global.Components;
  if (!Components) {
    return false;
  }
  try {
    if (!Components['classes']) {
      return false;
    }
  } catch (e) {
    return false;
  }

  // Populate the version checker functions.
  var cc = Components['classes'];
  var ci = Components['interfaces'];
  var versionComparator = cc['@mozilla.org/xpcom/version-comparator;1'][
      'getService'](ci['nsIVersionComparator']);
  var appInfo = cc['@mozilla.org/xre/app-info;1']['getService'](
      ci['nsIXULAppInfo']);
  var geckoVersion = appInfo['platformVersion'];
  var firefoxVersion = appInfo['version'];

  bot.userAgent.FIREFOX_EXTENSION_IS_ENGINE_VERSION_ = function(version) {
    return versionComparator.compare(geckoVersion, '' + version) >= 0;
  };
  bot.userAgent.FIREFOX_EXTENSION_IS_PRODUCT_VERSION_ = function(version) {
    return versionComparator.compare(firefoxVersion, '' + version) >= 0;
  };

  return true;
})();


/**
 * Whether we are on IOS.
 *
 * @const
 * @type {boolean}
 */
bot.userAgent.IOS = goog.userAgent.product.IPAD ||
                    goog.userAgent.product.IPHONE;


/**
 * Whether we are on a mobile browser.
 *
 * @const
 * @type {boolean}
 */
bot.userAgent.MOBILE = bot.userAgent.IOS || goog.userAgent.product.ANDROID;


/**
 * Android Operating System Version.
 *
 * @const
 * @type {number}
 * @private
 */
bot.userAgent.ANDROID_VERSION_ = (function() {
  if (goog.userAgent.product.ANDROID) {
    var userAgentString = goog.userAgent.getUserAgentString();
    var match = /Android\s+([0-9\.]+)/.exec(userAgentString);
    return match ? Number(match[1]) : 0;
  } else {
    return 0;
  }
})();


/**
 * Whether the current document is IE in IE9 (or newer) standards mode.
 * @type {boolean}
 * @const
 */
bot.userAgent.IE_DOC_9 = goog.userAgent.IE && document.documentMode >= 9;


/**
 * Whether the current document is IE in a documentMode older than 9.
 * @type {boolean}
 * @const
 */
bot.userAgent.IE_DOC_PRE9 = goog.userAgent.IE && !bot.userAgent.IE_DOC_9;

// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Atoms for simulating user actions against the browser window.
 */

goog.provide('bot.window');

goog.require('bot');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('bot.userAgent');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.userAgent');


/**
 * Whether the value of history.length includes a newly loaded page. If not,
 * after a new page load history.length is the number of pages that have loaded,
 * minus 1, but becomes the total number of pages on a subsequent back() call.
 *
 * @const
 * @type {boolean}
 * @private
 */
bot.window.HISTORY_LENGTH_INCLUDES_NEW_PAGE_ = !goog.userAgent.IE &&
    !goog.userAgent.OPERA;


/**
 * Whether value of history.length includes the pages ahead of the current one
 * in the history. If not, history.length equals the number of prior pages.
 * Here is the WebKit bug for this behavior that was fixed by version 533:
 * https://bugs.webkit.org/show_bug.cgi?id=24472
 *
 * @const
 * @type {boolean}
 * @private
 */
bot.window.HISTORY_LENGTH_INCLUDES_FORWARD_PAGES_ = !goog.userAgent.OPERA &&
    (!goog.userAgent.WEBKIT || bot.userAgent.isEngineVersion('533'));


/**
 * Go back in the browser history. The number of pages to go back can
 * optionally be specified and defaults to 1.
 *
 * @param {number=} opt_numPages Number of pages to go back.
 */
bot.window.back = function(opt_numPages) {
  // Relax the upper bound by one for browsers that do not count
  // newly loaded pages towards the value of window.history.length.
  var maxPages = bot.window.HISTORY_LENGTH_INCLUDES_NEW_PAGE_ ?
      bot.getWindow().history.length - 1 : bot.getWindow().history.length;
  var numPages = bot.window.checkNumPages_(maxPages, opt_numPages);
  bot.getWindow().history.go(-numPages);
};


/**
 * Go forward in the browser history. The number of pages to go forward can
 * optionally be specified and defaults to 1.
 *
 * @param {number=} opt_numPages Number of pages to go forward.
 */
bot.window.forward = function(opt_numPages) {
  // Do not check the upper bound (use null for infinity) for browsers that
  // do not count forward pages towards the value of window.history.length.
  var maxPages = bot.window.HISTORY_LENGTH_INCLUDES_FORWARD_PAGES_ ?
      bot.getWindow().history.length - 1 : null;
  var numPages = bot.window.checkNumPages_(maxPages, opt_numPages);
  bot.getWindow().history.go(numPages);
};


/**
 * @param {?number} maxPages Upper bound on number of pages; null for infinity.
 * @param {number=} opt_numPages Number of pages to move in history.
 * @return {number} Correct number of pages to move in history.
 * @private
 */
bot.window.checkNumPages_ = function(maxPages, opt_numPages) {
  var numPages = goog.isDef(opt_numPages) ? opt_numPages : 1;
  if (numPages <= 0) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'number of pages must be positive');
  }
  if (maxPages !== null && numPages > maxPages) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'number of pages must be less than the length of the browser history');
  }
  return numPages;
};


/**
 * Determine the size of the window that a user could interact with. This will
 * be the greatest of document.body.(width|scrollWidth), the same for
 * document.documentElement or the size of the viewport.
 *
 * @param {!Window=} opt_win Window to determine the size of. Defaults to
 *   bot.getWindow().
 * @return {!goog.math.Size} The calculated size.
 */
bot.window.getInteractableSize = function(opt_win) {
  var win = opt_win || bot.getWindow();
  var doc = win.document;
  var elem = doc.documentElement;
  var body = doc.body;
  if (!body) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'No BODY element present');
  }

  var widths = [
    elem.clientWidth, elem.scrollWidth, elem.offsetWidth,
    body.scrollWidth, body.offsetWidth
  ];
  var heights = [
    elem.clientHeight, elem.scrollHeight, elem.offsetHeight,
    body.scrollHeight, body.offsetHeight
  ];

  var width = Math.max.apply(null, widths);
  var height = Math.max.apply(null, heights);

  return new goog.math.Size(width, height);
};


/**
 * Determine the outer size of the window.
 *
 * @param {!Window=} opt_win Window to determine the size of. Defaults to
 *   bot.getWindow().
 * @return {!goog.math.Size} The calculated size.
 */
bot.window.getSize = function(opt_win) {
  var win = opt_win || bot.getWindow();

  var width = win.outerWidth;
  var height = win.outerHeight;

  return new goog.math.Size(width, height);
};


/**
 * Set the outer size of the window.
 *
 * @param {!goog.math.Size} size The new window size.
 * @param {!Window=} opt_win Window to determine the size of. Defaults to
 *   bot.getWindow().
 */
bot.window.setSize = function(size, opt_win) {
  var win = opt_win || bot.getWindow();

  win.resizeTo(size.width, size.height);
};


/**
 * Get the position of the window.
 *
 * @param {!Window=} opt_win Window to determine the position of. Defaults to
 *   bot.getWindow().
 * @return {!goog.math.Coordinate} The position of the window.
 */
bot.window.getPosition = function(opt_win) {
  var win = opt_win || bot.getWindow();
  var x, y;

  if (goog.userAgent.IE) {
    x = win.screenLeft;
    y = win.screenTop;
  } else {
    x = win.screenX;
    y = win.screenY;
  }

  return new goog.math.Coordinate(x, y);
};


/**
 * Set the position of the window.
 *
 * @param {!goog.math.Coordinate} targetPosition The target position.
 * @param {!Window=} opt_win Window to set the position of. Defaults to
 *   bot.getWindow().
 */
bot.window.setPosition = function(targetPosition, opt_win) {
  var win = opt_win || bot.getWindow();
  win.moveTo(targetPosition.x, targetPosition.y);
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('bot.locators.className');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.DomHelper');
goog.require('goog.string');


/**
 * Tests whether the standardized W3C Selectors API are available on an
 * element.
 * @param {!(Document|Element)} root The document or element to test for CSS
 *     selector support.
 * @return {boolean} Whether or not the root supports query selector APIs.
 * @see http://www.w3.org/TR/selectors-api/
 * @private
 */
bot.locators.className.canUseQuerySelector_ = function(root) {
  return !!(root.querySelectorAll && root.querySelector);
};


/**
 * Find an element by its class name.
 * @param {string} target The class name to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {Element} The first matching element found in the DOM, or null if no
 *     such element could be found.
 */
bot.locators.className.single = function(target, root) {
  if (!target) {
    throw Error('No class name specified');
  }

  target = goog.string.trim(target);
  if (target.split(/\s+/).length > 1) {
    throw Error('Compound class names not permitted');
  }

  // Closure will not properly escape class names that contain a '.' when using
  // the native selectors API, so we have to handle this ourselves.
  if (bot.locators.className.canUseQuerySelector_(root)) {
    return root.querySelector('.' + target.replace(/\./g, '\\.')) || null;
  }
  var elements = goog.dom.getDomHelper(root).getElementsByTagNameAndClass(
      /*tagName=*/'*', /*className=*/target, root);
  return elements.length ? elements[0] : null;
};


/**
 * Find an element by its class name.
 * @param {string} target The class name to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {!goog.array.ArrayLike} All matching elements, or an empty list.
 */
bot.locators.className.many = function(target, root) {
  if (!target) {
    throw Error('No class name specified');
  }

  target = goog.string.trim(target);
  if (target.split(/\s+/).length > 1) {
    throw Error('Compound class names not permitted');
  }

  // Closure will not properly escape class names that contain a '.' when using
  // the native selectors API, so we have to handle this ourselves.
  if (bot.locators.className.canUseQuerySelector_(root)) {
    return root.querySelectorAll('.' + target.replace(/\./g, '\\.'));
  }
  return goog.dom.getDomHelper(root).getElementsByTagNameAndClass(
      /*tagName=*/'*', /*className=*/target, root);
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO(simon): Add support for using sizzle to locate elements

goog.provide('bot.locators.css');

goog.require('bot.userAgent');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.userAgent');


/**
 * Find an element by using a CSS selector
 *
 * @param {string} target The selector to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {Element} The first matching element found in the DOM, or null if no
 *     such element could be found.
 */
bot.locators.css.single = function(target, root) {
  if (!goog.isFunction(root['querySelector']) &&
      // IE8 in non-compatibility mode reports querySelector as an object.
      goog.userAgent.IE && bot.userAgent.isEngineVersion(8) &&
      !goog.isObject(root['querySelector'])) {
    throw Error('CSS selection is not supported');
  }

  if (!target) {
    throw Error('No selector specified');
  }

  if (bot.locators.css.containsUnquotedComma_(target)) {
    throw Error('Compound selectors not permitted');
  }

  target = goog.string.trim(target);

  var element = root.querySelector(target);

  return element && element.nodeType == goog.dom.NodeType.ELEMENT ?
      (/**@type {Element}*/element) : null;
};


/**
 * Find all elements matching a CSS selector.
 *
 * @param {string} target The selector to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {!goog.array.ArrayLike} All matching elements, or an empty list.
 */
bot.locators.css.many = function(target, root) {
  if (!goog.isFunction(root['querySelectorAll']) &&
      // IE8 in non-compatibility mode reports querySelector as an object.
      goog.userAgent.IE && bot.userAgent.isEngineVersion(8) &&
      !goog.isObject(root['querySelector'])) {
    throw Error('CSS selection is not supported');
  }

  if (!target) {
    throw Error('No selector specified');
  }

  if (bot.locators.css.containsUnquotedComma_(target)) {
    throw Error('Compound selectors not permitted');
  }

  target = goog.string.trim(target);

  return root.querySelectorAll(target);
};


/**
 * @param {string} str String to check for commas outside a quoted block.
 * @return {boolean} Whether a comma is present outside a quoted string.
 * @private
 */
bot.locators.css.containsUnquotedComma_ = function(str) {
  return str.split(/(,)(?=(?:[^']|'[^']*')*$)/).length > 1 &&
         str.split(/(,)(?=(?:[^"]|"[^"]*")*$)/).length > 1;
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('bot.locators.id');

goog.require('bot.dom');
goog.require('goog.array');
goog.require('goog.dom');


/**
 * Find an element by using the value of the ID attribute.
 * @param {string} target The id to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {Element} The first matching element found in the DOM, or null if no
 *     such element could be found.
 */
bot.locators.id.single = function(target, root) {
  var dom = goog.dom.getDomHelper(root);

  var e = dom.getElement(target);
  if (!e) {
    return null;
  }

  // On IE getting by ID returns the first match by id _or_ name.
  if (bot.dom.getAttribute(e, 'id') == target && goog.dom.contains(root, e)) {
    return e;
  }

  var elements = dom.getElementsByTagNameAndClass('*');
  var element = goog.array.find(elements, function(element) {
    return bot.dom.getAttribute(element, 'id') == target &&
        goog.dom.contains(root, element);
  });
  return (/**@type{Element}*/element);
};


/**
 * Find many elements by using the value of the ID attribute.
 * @param {string} target The id to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {!goog.array.ArrayLike} All matching elements, or an empty list.
 */
bot.locators.id.many = function(target, root) {
  var dom = goog.dom.getDomHelper(root);
  var elements = dom.getElementsByTagNameAndClass('*', null, root);
  return goog.array.filter(elements, function(e) {
    return bot.dom.getAttribute(e, 'id') == target;
  });
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('bot.locators.linkText');
goog.provide('bot.locators.partialLinkText');

goog.require('bot');
goog.require('bot.dom');
goog.require('bot.locators.css');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.DomHelper');


/**
 * Find an element by using the text value of a link
 * @param {string} target The link text to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @param {boolean} opt_isPartial Whether the link text needs to be matched
 *     only partially.
 * @return {Element} The first matching element found in the DOM, or null if no
 *     such element could be found.
 * @private
 */
bot.locators.linkText.single_ = function(target, root, opt_isPartial) {
  var elements;
  try {
    elements = bot.locators.css.many('a', root);
  } catch (e) {
    // Old versions of browsers don't support CSS. They won't have XHTML
    // support. Sorry.
    elements = goog.dom.getDomHelper(root).getElementsByTagNameAndClass(
        goog.dom.TagName.A, /*className=*/null, root);
  }

  var element = goog.array.find(elements, function(element) {
    var text = bot.dom.getVisibleText(element);
    return (opt_isPartial && text.indexOf(target) != -1) || text == target;
  });
  return (/**@type{Element}*/element);
};


/**
 * Find many elements by using the value of the link text
 * @param {string} target The link text to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @param {boolean} opt_isPartial Whether the link text needs to be matched
 *     only partially.
 * @return {goog.array.ArrayLike} All matching elements, or an empty list.
 * @private
 */
bot.locators.linkText.many_ = function(target, root, opt_isPartial) {
  var elements;
  try {
    elements = bot.locators.css.many('a', root);
  } catch (e) {
    // Old versions of browsers don't support CSS. They won't have XHTML
    // support. Sorry.
    elements = goog.dom.getDomHelper(root).getElementsByTagNameAndClass(
        goog.dom.TagName.A, /*className=*/null, root);
  }

  return goog.array.filter(elements, function(element) {
    var text = bot.dom.getVisibleText(element);
    return (opt_isPartial && text.indexOf(target) != -1) || text == target;
  });
};


/**
 * Find an element by using the text value of a link
 * @param {string} target The link text to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {Element} The first matching element found in the DOM, or null if no
 *     such element could be found.
 */
bot.locators.linkText.single = function(target, root) {
  return bot.locators.linkText.single_(target, root, false);
};


/**
 * Find many elements by using the value of the link text
 * @param {string} target The link text to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {goog.array.ArrayLike} All matching elements, or an empty list.
 */
bot.locators.linkText.many = function(target, root) {
  return bot.locators.linkText.many_(target, root, false);
};


/**
 * Find an element by using part of the text value of a link.
 * @param {string} target The link text to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {Element} The first matching element found in the DOM, or null if no
 *     such element could be found.
 */
bot.locators.partialLinkText.single = function(target, root) {
  return bot.locators.linkText.single_(target, root, true);
};


/**
 * Find many elements by using part of the value of the link text.
 * @param {string} target The link text to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {goog.array.ArrayLike} All matching elements, or an empty list.
 */
bot.locators.partialLinkText.many = function(target, root) {
  return bot.locators.linkText.many_(target, root, true);
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Element locator functions.
 */


goog.provide('bot.locators');

goog.require('bot');
goog.require('bot.locators.className');
goog.require('bot.locators.css');
goog.require('bot.locators.id');
goog.require('bot.locators.linkText');
goog.require('bot.locators.name');
goog.require('bot.locators.partialLinkText');
goog.require('bot.locators.tagName');
goog.require('bot.locators.xpath');
goog.require('goog.array');  // for the goog.array.ArrayLike typedef
goog.require('goog.object');


/**
 * @typedef {{single:function(string,!(Document|Element)):Element,
 *     many:function(string,!(Document|Element)):!goog.array.ArrayLike}}
 */
bot.locators.strategy;


/**
 * Known element location strategies. The returned objects have two
 * methods on them, "single" and "many", for locating a single element
 * or multiple elements, respectively.
 *
 * Note that the versions with spaces are synonyms for those without spaces,
 * and are specified at:
 * https://code.google.com/p/selenium/wiki/JsonWireProtocol
 *
 * @private
 * @const
 * @type {Object.<string,bot.locators.strategy>}
 */
bot.locators.STRATEGIES_ = {
  'className': bot.locators.className,
  'class name': bot.locators.className,

  'css': bot.locators.css,
  'css selector': bot.locators.css,

  'id': bot.locators.id,

  'linkText': bot.locators.linkText,
  'link text': bot.locators.linkText,

  'name': bot.locators.name,

  'partialLinkText': bot.locators.partialLinkText,
  'partial link text': bot.locators.partialLinkText,

  'tagName': bot.locators.tagName,
  'tag name': bot.locators.tagName,

  'xpath': bot.locators.xpath
};


/**
 * Add or override an existing strategy for locating elements.
 *
 * @param {string} name The name of the strategy.
 * @param {!bot.locators.strategy} strategy The strategy to use.
 */
bot.locators.add = function(name, strategy) {
  bot.locators.STRATEGIES_[name] = strategy;
};


/**
 * Returns one key from the object map that is not present in the
 * Object.prototype, if any exists.
 *
 * @param {Object} target The object to pick a key from.
 * @return {string?} The key or null if the object is empty.
 */
bot.locators.getOnlyKey = function(target) {
  for (var k in target) {
    if (target.hasOwnProperty(k)) {
      return k;
    }
  }
  return null;
};


/**
 * Find the first element in the DOM matching the target. The target
 * object should have a single key, the name of which determines the
 * locator strategy and the value of which gives the value to be
 * searched for. For example {id: 'foo'} indicates that the first
 * element on the DOM with the ID 'foo' should be returned.
 *
 * @param {!Object} target The selector to search for.
 * @param {(Document|Element)=} opt_root The node from which to start the
 *     search. If not specified, will use {@code document} as the root.
 * @return {Element} The first matching element found in the DOM, or null if no
 *     such element could be found.
 */
bot.locators.findElement = function(target, opt_root) {
  var key = bot.locators.getOnlyKey(target);

  if (key) {
    var strategy = bot.locators.STRATEGIES_[key];
    if (strategy && goog.isFunction(strategy.single)) {
      var root = opt_root || bot.getDocument();
      return strategy.single(target[key], root);
    }
  }
  throw Error('Unsupported locator strategy: ' + key);
};


/**
 * Find all elements in the DOM matching the target. The target object
 * should have a single key, the name of which determines the locator
 * strategy and the value of which gives the value to be searched
 * for. For example {name: 'foo'} indicates that all elements with the
 * 'name' attribute equal to 'foo' should be returned.
 *
 * @param {!Object} target The selector to search for.
 * @param {(Document|Element)=} opt_root The node from which to start the
 *     search. If not specified, will use {@code document} as the root.
 * @return {!goog.array.ArrayLike.<Element>} All matching elements found in the
 *     DOM.
 */
bot.locators.findElements = function(target, opt_root) {
  var key = bot.locators.getOnlyKey(target);

  if (key) {
    var strategy = bot.locators.STRATEGIES_[key];
    if (strategy && goog.isFunction(strategy.many)) {
      var root = opt_root || bot.getDocument();
      return strategy.many(target[key], root);
    }
  }
  throw Error('Unsupported locator strategy: ' + key);
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('bot.locators.name');

goog.require('bot.dom');
goog.require('goog.array');
goog.require('goog.dom');


/**
 * Find an element by the value of the name attribute
 *
 * @param {string} target The name to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {Element} The first matching element found in the DOM, or null if no
 *     such element could be found.
 */
bot.locators.name.single = function(target, root) {
  var dom = goog.dom.getDomHelper(root);
  var allElements = dom.getElementsByTagNameAndClass('*', null, root);
  var element = goog.array.find(allElements, function(element) {
    return bot.dom.getAttribute(element, 'name') == target;
  });
  return (/**@type{Element}*/element);
};


/**
 * Find all elements by the value of the name attribute
 *
 * @param {string} target The name to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {!goog.array.ArrayLike} All matching elements, or an empty list.
 */
bot.locators.name.many = function(target, root) {
  var dom = goog.dom.getDomHelper(root);
  var allElements = dom.getElementsByTagNameAndClass('*', null, root);
  return goog.array.filter(allElements, function(element) {
    return bot.dom.getAttribute(element, 'name') == target;
  });
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('bot.locators.tagName');

goog.require('goog.array');


/**
 * Find an element by its tag name.
 * @param {string} target The tag name to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {Element} The first matching element found in the DOM, or null if no
 *     such element could be found.
 */
bot.locators.tagName.single = function(target, root) {
  return root.getElementsByTagName(target)[0] || null;
};


/**
 * Find all elements with a given tag name.
 * @param {string} target The tag name to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {goog.array.ArrayLike} All matching elements, or an empty list.
 */
bot.locators.tagName.many = function(target, root) {
  return root.getElementsByTagName(target);
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Functions to locate elements by XPath.
 *
 * <p>The locator implementations below differ from the Closure functions
 * goog.dom.xml.{selectSingleNode,selectNodes} in three important ways:
 * <ol>
 * <li>they do not refer to "document" which is undefined in the context of a
 * Firefox extension;
 * <li> they use a default NsResolver for browsers that do not provide
 * document.createNSResolver (e.g. Android); and
 * <li> they prefer document.evaluate to node.{selectSingleNode,selectNodes}
 * because the latter silently return nothing when the xpath resolves to a
 * non-Node type, limiting the error-checking the implementation can provide.
 * </ol>
 *
 * TODO(user): Add support for browsers without native xpath
 */

goog.provide('bot.locators.xpath');

goog.require('bot');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('goog.userAgent');


/**
 * XPathResult enum values. These are defined separately since
 * the context running this script may not support the XPathResult
 * type.
 * @enum {number}
 * @see http://www.w3.org/TR/DOM-Level-3-XPath/xpath.html#XPathResult
 * @private
 */
// TODO(berrada): Move this enum back to bot.locators.xpath namespace.
// The problem is that we alias bot.locators.xpath in locators.js, while
// we set the flag --collapse_properties (http://goo.gl/5W6cP).
// The compiler should have thrown the error anyways, it's a bug that it fails
// only when introducing this enum.
// Solution: remove --collapase_properties from the js_binary rule or
// use goog.exportSymbol to export the public methods and get rid of the alias.
bot.locators.XPathResult_ = {
  ORDERED_NODE_SNAPSHOT_TYPE: 7,
  FIRST_ORDERED_NODE_TYPE: 9
};


/**
 * Default XPath namespace resolver.
 * @private
 */
bot.locators.xpath.DEFAULT_RESOLVER_ = (function() {
  var namespaces = {svg: 'http://www.w3.org/2000/svg'};
  return function(prefix) {
    return namespaces[prefix] || null;
  };
})();


/**
 * Evaluates an XPath expression using a W3 XPathEvaluator.
 * @param {!(Document|Element)} node The document or element to perform the
 *     search under.
 * @param {string} path The xpath to search for.
 * @param {!bot.locators.XPathResult_} resultType The desired result type.
 * @return {XPathResult} The XPathResult or null if the root's ownerDocument
 *     does not support XPathEvaluators.
 * @private
 * @see http://www.w3.org/TR/DOM-Level-3-XPath/xpath.html#XPathEvaluator-evaluate
 */
bot.locators.xpath.evaluate_ = function(node, path, resultType) {
  var doc = goog.dom.getOwnerDocument(node);
  if (!doc.implementation.hasFeature('XPath', '3.0')) {
    return null;
  }
  try {
    // Android 2.2 and earlier do not support createNSResolver
    var resolver = doc.createNSResolver ?
        doc.createNSResolver(doc.documentElement) :
        bot.locators.xpath.DEFAULT_RESOLVER_;
    return doc.evaluate(path, node, resolver, resultType, null);
  } catch (ex) {
    // The Firefox XPath evaluator can throw an exception if the document is
    // queried while it's in the midst of reloading, so we ignore it. In all
    // other cases, we assume an invalid xpath has caused the exception.
    if (!(goog.userAgent.GECKO && ex.name == 'NS_ERROR_ILLEGAL_VALUE')) {
      throw new bot.Error(bot.ErrorCode.INVALID_SELECTOR_ERROR,
          'Unable to locate an element with the xpath expression ' + path +
          ' because of the following error:\n' + ex);
    }
  }
};


/**
 * @param {Node|undefined} node Node to check whether it is an Element.
 * @param {string} path XPath expression to include in the error message.
 * @private
 */
bot.locators.xpath.checkElement_ = function(node, path) {
  if (!node || node.nodeType != goog.dom.NodeType.ELEMENT) {
    throw new bot.Error(bot.ErrorCode.INVALID_SELECTOR_ERROR,
        'The result of the xpath expression "' + path +
        '" is: ' + node + '. It should be an element.');
  }
};


/**
 * Find an element by using an xpath expression
 * @param {string} target The xpath to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {Element} The first matching element found in the DOM, or null if no
 *     such element could be found.
 */
bot.locators.xpath.single = function(target, root) {

  function selectSingleNode() {
    var result = bot.locators.xpath.evaluate_(root, target,
        bot.locators.XPathResult_.FIRST_ORDERED_NODE_TYPE);
    if (result) {
      var node = result.singleNodeValue;
      // On Opera, a singleNodeValue of undefined indicates a type error, while
      // other browsers may use it to indicate something has not been found.
      return goog.userAgent.OPERA ? node : (node || null);
    } else if (root.selectSingleNode) {
      var doc = goog.dom.getOwnerDocument(root);
      if (doc.setProperty) {
        doc.setProperty('SelectionLanguage', 'XPath');
      }
      return root.selectSingleNode(target);
    }
    return null;
  }

  var node = selectSingleNode();
  if (!goog.isNull(node)) {
    bot.locators.xpath.checkElement_(node, target);
  }
  return (/** @type {Element} */node);
};


/**
 * Find elements by using an xpath expression
 * @param {string} target The xpath to search for.
 * @param {!(Document|Element)} root The document or element to perform the
 *     search under.
 * @return {!goog.array.ArrayLike} All matching elements, or an empty list.
 */
bot.locators.xpath.many = function(target, root) {

  function selectNodes() {
    var result = bot.locators.xpath.evaluate_(root, target,
        bot.locators.XPathResult_.ORDERED_NODE_SNAPSHOT_TYPE);
    if (result) {
      var count = result.snapshotLength;
      // On Opera, if the XPath evaluates to a non-Node value, snapshotLength
      // will be undefined and the result empty, so fail immediately.
      if (goog.userAgent.OPERA && !goog.isDef(count)) {
        bot.locators.xpath.checkElement_(null, target);
      }
      var results = [];
      for (var i = 0; i < count; ++i) {
        results.push(result.snapshotItem(i));
      }
      return results;
    } else if (root.selectNodes) {
      var doc = goog.dom.getOwnerDocument(root);
      if (doc.setProperty) {
        doc.setProperty('SelectionLanguage', 'XPath');
      }
      return root.selectNodes(target);
    }
    return [];
  }

  var nodes = selectNodes();
  goog.array.forEach(nodes, function(n) {
    bot.locators.xpath.checkElement_(n, target);
  });
  return (/** @type {!goog.array.ArrayLike} */nodes);
};
// Copyright 2011 WebDriver committers
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Atom to access application cache status.
 *
 */

goog.provide('bot.appcache');

goog.require('bot');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('bot.html5');


/**
 * Returns the current state of the application cache.
 *
 * @param {Window=} opt_window The window object whose cache is checked;
 *     defaults to the main window.
 * @return {number} The state.
 */
bot.appcache.getStatus = function(opt_window) {
  var win = opt_window || bot.getWindow();

  if (bot.html5.isSupported(bot.html5.API.APPCACHE, win)) {
    return win.applicationCache.status;
  } else {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Undefined application cache');
  }
};
// Copyright 2011 WebDriver committers
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Atoms to check to connection state of a browser.
 *
 */

goog.provide('bot.connection');

goog.require('bot');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('bot.html5');


/**
 * @return {boolean} Whether the browser currently has an internet
 *     connection.
 */
bot.connection.isOnline = function() {

  if (bot.html5.isSupported(bot.html5.API.BROWSER_CONNECTION)) {
    var win = bot.getWindow();
    return win.navigator.onLine;
  } else {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
        'Undefined browser connection state');
  }
};
// Copyright 2011 WebDriver committers
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Atoms for executing SQL queries on web client database.
 *
 */

goog.provide('bot.storage.database');
goog.provide('bot.storage.database.ResultSet');

goog.require('bot');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('bot.html5');


/**
 * Opens the database to access its contents. This function will create the
 * database if it does not exist. For details,
 * @see http://www.w3.org/TR/webdatabase/#databases
 *
 * @param {string} databaseName The name of the database.
 * @param {string=} opt_version The expected database version to be opened;
 *     defaults to the empty string.
 * @param {string=} opt_displayName The name to be displayed to the user;
 *     defaults to the databaseName.
 * @param {number=} opt_size The estimated initial quota size of the database;
 *     default value is 5MB.
 * @param {Window=} opt_window The window associated with the database;
 *     defaults to the main window.
 * @return {Database} The object to access the web database.
 *
 */
bot.storage.database.openOrCreate = function(databaseName, opt_version,
    opt_displayName, opt_size, opt_window) {
  var version = opt_version || '';
  var displayName = opt_displayName || (databaseName + 'name');
  var size = opt_size || 5 * 1024 * 1024;
  var win = opt_window || bot.getWindow();
  var db;

  return win.openDatabase(databaseName, version, displayName, size);
};


/**
 * It executes a single SQL query on a given web database storage.
 *
 * @param {string} databaseName The name of the database.
 * @param {string} query The SQL statement.
 * @param {Array.<*>} args Arguments needed for the SQL statement.
 * @param {!function(!SQLTransaction, !bot.storage.database.ResultSet)}
 *     queryResultCallback Callback function to be invoked on successful query
 *     statement execution.
 * @param {!function(SQLError)} txErrorCallback
 *     Callback function to be invoked on transaction (commit) failure.
 * @param {!function()=} opt_txSuccessCallback
 *     Callback function to be invoked on successful transaction execution.
 * @param {function(!SQLTransaction, !SQLError)=} opt_queryErrorCallback
 *     Callback function to be invoked on successful query statement execution.
 * @see http://www.w3.org/TR/webdatabase/#executing-sql-statements
 */
bot.storage.database.executeSql = function(databaseName, query, args,
    queryResultCallback, txErrorCallback, opt_txSuccessCallback,
    opt_queryErrorCallback) {

  var db;

  try {
    db = bot.storage.database.openOrCreate(databaseName);
  } catch (e) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR, e.message);
  }

  var queryCallback = function(tx, result) {
    var wrappedResult = new bot.storage.database.ResultSet(result);
    queryResultCallback(tx, wrappedResult);
  }

  var transactionCallback = function(tx) {
    tx.executeSql(query, args, queryCallback, opt_queryErrorCallback);
  }

  db.transaction(transactionCallback, txErrorCallback,
      opt_txSuccessCallback);
};



/**
 * A wrapper of the SQLResultSet object returned by the SQL statement.
 *
 * @param {!SQLResultSet} sqlResultSet The original SQLResultSet object.
 * @constructor
 */
bot.storage.database.ResultSet = function(sqlResultSet) {

  /**
   * The database rows retuned from the SQL query.
   * @type {!Array.<*>}
   */
  this.rows = [];
  for (var i = 0; i < sqlResultSet.rows.length; i++) {
    this.rows[i] = sqlResultSet.rows.item(i);
  }

  /**
   * The number of rows that were changed by the SQL statement
   * @type {number}
   */
  this.rowsAffected = sqlResultSet.rowsAffected;

  /**
   * The row ID of the row that the SQLResultSet object's SQL statement
   * inserted into the database, if the statement inserted a row; else
   * it is assigned to -1. Originally, accessing insertId attribute of
   * a SQLResultSet object returns the exception INVALID_ACCESS_ERR
   * if no rows are inserted.
   * @type {number}
   */
  this.insertId = -1;
  try {
    this.insertId = sqlResultSet.insertId;
  } catch (error) {
    // If accessing sqlResultSet.insertId results in INVALID_ACCESS_ERR
    // exception, this.insertId will be assigned to -1.
  }
};
// Copyright 2011 WebDriver committers
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Helper function to determine which HTML5 features are
 * supported by browsers..
 */

goog.provide('bot.html5');

goog.require('bot');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('bot.userAgent');
goog.require('goog.userAgent');
goog.require('goog.userAgent.product');


/**
 * Identifier for supported HTML5 API in Webdriver.
 *
 * @enum {string}
 */
bot.html5.API = {
  APPCACHE: 'appcache',
  BROWSER_CONNECTION: 'browser_connection',
  DATABASE: 'database',
  GEOLOCATION: 'location',
  LOCAL_STORAGE: 'local_storage',
  SESSION_STORAGE: 'session_storage',
  VIDEO: 'video',
  AUDIO: 'audio',
  CANVAS: 'canvas'
};


/**
 * True if the current browser is IE8.
 *
 * @private
 * @type {boolean}
 * @const
 */
bot.html5.IS_IE8_ = goog.userAgent.IE &&
    bot.userAgent.isEngineVersion(8) && !bot.userAgent.isEngineVersion(9);


/**
 * True if the current browser is Safari 4.
 *
 * @private
 * @type {boolean}
 * @const
 */
bot.html5.IS_SAFARI4_ = goog.userAgent.product.SAFARI &&
    bot.userAgent.isProductVersion(4) && !bot.userAgent.isProductVersion(5);


/**
 * True if the browser is Android 2.2 (Froyo).
 *
 * @private
 * @type {boolean}
 * @const
 */
bot.html5.IS_ANDROID_FROYO_ = goog.userAgent.product.ANDROID &&
    bot.userAgent.isProductVersion(2.2) && !bot.userAgent.isProductVersion(2.3);


/**
 * True if the current browser is Safari 5 on Windows.
 *
 * @private
 * @type {boolean}
 * @const
 */
bot.html5.IS_SAFARI_WINDOWS_ = goog.userAgent.WINDOWS &&
    goog.userAgent.product.SAFARI &&
    (bot.userAgent.isProductVersion(4)) &&
    !bot.userAgent.isProductVersion(6);


/**
 * Checks if the browser supports an HTML5 feature.
 *
 * @param {bot.html5.API} api HTML5 API identifier.
 * @param {!Window=} opt_window The window to be accessed;
 *     defaults to the main window.
 * @return {boolean} Whether the browser supports the feature.
 */
bot.html5.isSupported = function(api, opt_window) {
  var win = opt_window || bot.getWindow();

  switch (api) {
    case bot.html5.API.APPCACHE:
      // IE8 does not support application cache, though the APIs exist.
      if (bot.html5.IS_IE8_) {
        return false;
      }
      return goog.isDefAndNotNull(win.applicationCache);

    case bot.html5.API.BROWSER_CONNECTION:
      return goog.isDefAndNotNull(win.navigator) &&
          goog.isDefAndNotNull(win.navigator.onLine);

    case bot.html5.API.DATABASE:
      // Safari4 database API does not allow writes.
      if (bot.html5.IS_SAFARI4_) {
        return false;
      }
      // Android Froyo does not support database, though the APIs exist.
      if (bot.html5.IS_ANDROID_FROYO_) {
        return false;
      }
      return goog.isDefAndNotNull(win.openDatabase);

    case bot.html5.API.GEOLOCATION:
      // Safari 4,5 on Windows do not support geolocation, see:
      // https://discussions.apple.com/thread/3547900
      if (bot.html5.IS_SAFARI_WINDOWS_) {
        return false;
      }
      return goog.isDefAndNotNull(win.navigator) &&
          goog.isDefAndNotNull(win.navigator.geolocation);

    case bot.html5.API.LOCAL_STORAGE:
      // IE8 does not support local storage, though the APIs exist.
      if (bot.html5.IS_IE8_) {
        return false;
      }
      return goog.isDefAndNotNull(win.localStorage);

    case bot.html5.API.SESSION_STORAGE:
      // IE8 does not support session storage, though the APIs exist.
      if (bot.html5.IS_IE8_) {
        return false;
      }
      return goog.isDefAndNotNull(win.sessionStorage) &&
          // To avoid browsers that only support this API partically
          // like some versions of FF.
          goog.isDefAndNotNull(win.sessionStorage.clear);

    default:
      throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
          'Unsupported API identifier provided as parameter');
  }
};
// Copyright 2011 WebDriver committers
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Atom to retrieve the physical location of the device.
 *
 */

goog.provide('bot.geolocation');

goog.require('bot');
goog.require('bot.html5');


/**
 * Default parameters used to configure the geolocation.getCurrentPosition
 * method. These parameters mean retrieval of any cached position with high
 * accuracy within a timeout interval of 5s.
 * @const
 * @type {GeolocationPositionOptions}
 * @see http://dev.w3.org/geo/api/spec-source.html#position-options
 */
bot.geolocation.DEFAULT_OPTIONS = /** @type {GeolocationPositionOptions} */ {
  enableHighAccuracy: true,
  maximumAge: Infinity,
  timeout: 5000
};


/**
 * Provides a mechanism to retrieve the geolocation of the device.  It invokes
 * the navigator.geolocation.getCurrentPosition method of the HTML5 API which
 * later callbacks with either position value or any error. The position/
 * error is updated with the callback functions.
 *
 * @param {function(?GeolocationPosition)} successCallback The callback method
 *     which is invoked on success.
 * @param {function(GeolocationPositionError)=} opt_errorCallback The callback
 *     method which is invoked on error.
 * @param {GeolocationPositionOptions=} opt_options The optional parameters to
 *     navigator.geolocation.getCurrentPosition; defaults to
 *     bot.geolocation.DEFAULT_OPTIONS.
 */
bot.geolocation.getCurrentPosition = function(successCallback,
    opt_errorCallback, opt_options) {
  var win = bot.getWindow();
  var posOptions = opt_options || bot.geolocation.DEFAULT_OPTIONS;

  if (bot.html5.isSupported(bot.html5.API.GEOLOCATION, win)) {
    var geolocation = win.navigator.geolocation;
    geolocation.getCurrentPosition(successCallback,
        opt_errorCallback, posOptions);
  } else {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR, 'Geolocation undefined');
  }
};
// Copyright 2011 WebDriver committers
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Atoms for accessing HTML5 web storage maps (localStorage,
 * sessionStorage). These storage objects store each item as a key-value
 * mapping pair.
 *
 */

goog.provide('bot.storage');
goog.provide('bot.storage.Storage');

goog.require('bot');
goog.require('bot.Error');
goog.require('bot.ErrorCode');
goog.require('bot.html5');


/**
 * A factory method to create a wrapper to access the HTML5 localStorage
 * object.
 * Note: We are not using Closure from goog.storage,
 * Closure uses "window" object directly, which may not always be
 * defined (for example in firefox extensions).
 * We use bot.window() from bot.js instead to keep track of the window or frame
 * is currently being used for command execution. The implementation is
 * otherwise similar to the implementation in the Closure library
 * (goog.storage.mechansim.HTML5LocalStorage).
 *
 * @param {Window=} opt_window The window whose storage to access;
 *     defaults to the main window.
 * @return {!bot.storage.Storage} The wrapper Storage object.
 */
bot.storage.getLocalStorage = function(opt_window) {
  var win = opt_window || bot.getWindow();

  if (!bot.html5.isSupported(bot.html5.API.LOCAL_STORAGE, win)) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR, 'Local storage undefined');
  }
  var storageMap = win.localStorage;
  return new bot.storage.Storage(storageMap);
};


/**
 * A factory method to create a wrapper to access the HTML5 sessionStorage
 * object.
 *
 * @param {Window=} opt_window The window whose storage to access;
 *     defaults to the main window.
 * @return {!bot.storage.Storage} The wrapper Storage object.
 */
bot.storage.getSessionStorage = function(opt_window) {
  var win = opt_window || bot.getWindow();

  if (bot.html5.isSupported(bot.html5.API.SESSION_STORAGE, win)) {
    var storageMap = win.sessionStorage;
    return new bot.storage.Storage(storageMap);
  }
  throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR,
      'Session storage undefined');
};



/**
 * Provides a wrapper object to the HTML5 web storage object.
 * @constructor
 *
 * @param {Storage} storageMap HTML5 storage object e.g. localStorage,
 *     sessionStorage.
 */
bot.storage.Storage = function(storageMap) {
  /**
   * Member variable to access the assigned HTML5 storage object.
   * @type {Storage}
   * @private
   */
  this.storageMap_ = storageMap;
};


/**
 * Sets the value item of a key/value pair in the Storage object.
 * If the value given is null, the string 'null' will be inserted
 * instead.
 *
 * @param {string} key The key of the item.
 * @param {*} value The value of the item.
 */
bot.storage.Storage.prototype.setItem = function(key, value) {
  try {
    // Note: Ideally, browsers should set a null value. But the browsers
    // report arbitrarily. Firefox returns <null>, while Chrome reports
    // the string "null". We are setting the value to the string "null".
    this.storageMap_.setItem(key, value + '');
  } catch (e) {
    throw new bot.Error(bot.ErrorCode.UNKNOWN_ERROR, e.message);
  }
};


/**
 * Returns the value item of a key in the Storage object.
 *
 * @param {string} key The key of the returned value.
 * @return {?string} The mapped value if present in the storage object,
 *     otherwise null. If a null value  was inserted for a given
 *     key, then the string 'null' is returned.
 */
bot.storage.Storage.prototype.getItem = function(key) {
  var value = this.storageMap_.getItem(key);
  return  /** @type {string} */ value;
};


/**
 * Returns an array of keys of all keys of the Storage object.
 *
 * @return {Array.<string>} The array of stored keys..
 */
bot.storage.Storage.prototype.keySet = function() {
  var keys = [];
  var length = this.size();
  for (var i = 0; i < length; i++) {
    keys[i] = this.storageMap_.key(i);
  }
  return keys;
};


/**
 * Removes an item with a given key.
 *
 * @param {string} key The key item of the key/value pair.
 * @return {*} The removed value if present, otherwise null.
 */
bot.storage.Storage.prototype.removeItem = function(key) {
  var value = this.storageMap_.getItem(key);
  this.storageMap_.removeItem(key);
  return value;
};


/**
 * Removes all items.
 */
bot.storage.Storage.prototype.clear = function() {
  this.storageMap_.clear();
};


/**
 * Returns the number of items in the Storage object.
 *
 * @return {number} The number of the key/value pairs.
 */
bot.storage.Storage.prototype.size = function() {
  return this.storageMap_.length;
};


/**
 * Returns the key item of the key/value pairs in the Storage object
 * of a given index.
 *
 * @param {number} index The index of the key/value pair list.
 * @return {?string} The key item of a given index.
 */
bot.storage.Storage.prototype.key = function(index) {
  return this.storageMap_.key(index);
};


/**
 * Returns HTML5 storage object of the wrapper Storage object
 *
 * @return {Storage} The storageMap attribute.
 */
bot.storage.Storage.prototype.getStorageMap = function() {
  return this.storageMap_;
};
// Copyright 2010 WebDriver committers
// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('webdriver.iphone');

goog.require('bot.inject');



/**
 * Executes a random snippet of JavaScript that defines the body of a function
 * to invoke. This function is intended to be wrapped inside
 * {@code bot.inject.executeScript} as a JavaScript atom.
 *
 * @param {!Function} fn The function to invoke.
 * @param {!Array.<*>} args The list of arguments to pass to the script.
 * @param {number} timeout The amount of time, in milliseconds, the script
 *     should be permitted to run.
 */
webdriver.iphone.executeAsyncScript = function(fn, args, timeout) {
  bot.inject.executeAsyncScript(fn, args, timeout, function(data) {
    window.location.href = 'webdriver://executeAsyncScript?' + data;
  }, window, true);
};
