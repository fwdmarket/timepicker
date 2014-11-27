/* ****************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 FwdMarket
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *******************************************************************************/

(function ($, undefined) {
  var $window = $(window);

  var TimePicker = function (element, options) {
    var val, aux;
    this.element = $(element);
    val = this.element.val();
    this.initOptions(options);
    if (val != '') {
      this.value = moment(val, this.options.valueFormat);
    } else {
      this.value = moment();
      aux = (this.value.hours() * 60 + this.value.minutes()) % this.options.increment;
      if (aux != 0) {
        this.value.subtract(aux, 'm');
      }
    }
    this.picker = $(TPGlobal.template);
    this.picker.addClass('timepicker-dropdown dropdown-menu');
    this.attachEvents();
  };

  TimePicker.prototype = {
    constructor: TimePicker,
    value: null,
    options: {},
    initOptions: function (options) {
      //set options
      this.options = $.extend({}, this.options, defaults, options);
      if (this.options.orientation == 'auto') {
        this.options.orientation = {x: 'auto', y: 'auto'};
      }
    },
    add: function (interval, type) {
      this.value.add(interval, type);
      this.triggerChange();
    },
    subtract: function (interval, type) {
      this.value.subtract(interval, type);
      this.triggerChange();
    },
    attachEvents: function () {
      var self = this;
      this.element.on('focus, click', function (event) {
        self.show();
      });
      this.picker.on('click', '.time-inc .time-btn', function (event) {
        event.preventDefault();
        self.add(self.options.increment, 'm');
      });
      this.picker.on('click', '.time-dec .time-btn', function (event) {
        event.preventDefault();
        self.subtract(self.options.increment, 'm');
      });
      this.picker.on('keydown', $.proxy(this.keydown, this));
      $(window).on('resize', $.proxy(this.place, this));
      $(document).on('mousedown touchstart', $.proxy(function (event) {
        if (!( this.element.is(event.target)
          || this.picker.is(event.target)
          || this.element.find(event.target).length
          || this.picker.find(event.target).length
          )) {
          this.hide();
        }
      }, this));
    },
    triggerChange: function () {
      this.setValue();
      this.update();
    },
    keydown: function (event) {
      switch (event.keyCode) {
        case 37: //left
          this.subtract(this.options.increment, 'm');
          break;
        case 39: //right
          this.add(this.options.increment, 'm');
          break;
        case 13:
          this.hide();
          break;
      }
    },
    show: function () {
      this.picker.appendTo('body');
      this.picker.show();
      this.place();
      this.update();
      this.picker.css('display', 'block');
    },
    hide: function () {
      if (!this.picker.is(':visible'))
        return;
      this.picker.hide().detach();

      if (this.element.val()) {
        this.setValue();
      }
    },
    remove: function () {
      this.hide();
      this.picker.remove();
      delete this.element.data().timepicker;
      delete this.element.data().time;
    },
    setValue: function () {
      var formatted = this.value.format(this.options.valueFormat);
      this.element.val(formatted).change();
    },
    update: function () {
      this.picker.find('.time').html(this.value.format(this.options.timeFormat));
      this.picker.find('.meridiem').html(this.value.format(this.options.meridiemFormat));
    },
    place: function () {
      var calendarWidth = this.picker.outerWidth(),
        calendarHeight = this.picker.outerHeight(),
        visualPadding = 10,
        windowWidth = $window.width(),
        windowHeight = $window.height(),
        scrollTop = $window.scrollTop();

      var zIndex = parseInt(this.element.parents().filter(function () {
        return $(this).css('z-index') !== 'auto';
      }).first().css('z-index')) + 10;
      var offset = this.component ? this.component.parent().offset() : this.element.offset();
      var height = this.component ? this.component.outerHeight(true) : this.element.outerHeight(false);
      var width = this.component ? this.component.outerWidth(true) : this.element.outerWidth(false);
      var left = offset.left,
        top = offset.top;

      this.picker.removeClass(
        'timepicker-orient-top timepicker-orient-bottom ' +
          'timepicker-orient-right timepicker-orient-left'
      );

      if (this.options.orientation.x !== 'auto') {
        this.picker.addClass('timepicker-orient-' + this.options.orientation.x);
        if (this.options.orientation.x === 'right')
          left -= calendarWidth - width;
      }
      // auto x orientation is best-placement: if it crosses a window
      // edge, fudge it sideways
      else {
        // Default to left
        this.picker.addClass('timepicker-orient-left');
        if (offset.left < 0)
          left -= offset.left - visualPadding;
        else if (offset.left + calendarWidth > windowWidth)
          left = windowWidth - calendarWidth - visualPadding;
      }

      // auto y orientation is best-situation: top or bottom, no fudging,
      // decision based on which shows more of the calendar
      var yorient = this.options.orientation.y,
        top_overflow, bottom_overflow;
      if (yorient === 'auto') {
        top_overflow = -scrollTop + offset.top - calendarHeight;
        bottom_overflow = scrollTop + windowHeight - (offset.top + height + calendarHeight);
        if (Math.max(top_overflow, bottom_overflow) === bottom_overflow)
          yorient = 'top';
        else
          yorient = 'bottom';
      }
      this.picker.addClass('timepicker-orient-' + yorient);
      if (yorient === 'top')
        top += height;
      else
        top -= calendarHeight + parseInt(this.picker.css('padding-top'));

      this.picker.css({
        top: top,
        left: left,
        zIndex: zIndex
      });
    }
  };

  var old = $.fn.timepicker;
  $.fn.timepicker = function (option) {
    //get extra arguments
    var args = Array.apply(null, arguments);
    args.shift();
    //find every matched input and init the timepicker
    this.each(function () {
      var $this = $(this),
        data = $this.data('timepicker'),
        options = typeof option === 'object' && option,
        opts = $.extend({}, defaults, options);
      if (!data) {
        $this.data('timepicker', data = (new TimePicker(this, opts)));
      }
      //check if the option is a method name and call it with the supplied arguments
      if (typeof option === 'string' && typeof data[option] === 'function'){
        data[option].apply(data, args);
      }
    });
    return this;
  };

  var defaults = $.fn.timepicker.defaults = {
    orientation: "auto",
    increment: 15,
    valueFormat: 'h:mm A',
    timeFormat: 'h:mm',
    meridiemFormat: 'A',
    rtl: false
  };

  $.fn.timepicker.Constructor = TimePicker;

  var TPGlobal = {};

  $.fn.timepicker.TPGlobal = TPGlobal;

  TPGlobal.template =
    '<div class="timepicker dropdown">' +
      '<div class="timepicker-header">Select time of day</div>' +
      '<div class="timepicker-body">' +
      '<div class="time-dec">' +
      '<a href="#" class="time-btn">&leftarrow;</a>' +
      '</div>' +
      '<p>' +
      '<strong class="time"></strong>' +
      '<span class="meridiem"></span>' +
      '</p>' +
      '<div class="time-inc">' +
      '<a href="#" class="time-btn">&rightarrow;</a>' +
      '</div>' +
      '</div>' +
      '</div>'
  ;

  /* TIMEPICKER NO CONFLICT
   * =================== */

  $.fn.timepicker.noConflict = function () {
    $.fn.timepicker = old;
    return this;
  };

  $(document).on(
    'focus.timepicker.data-api click.timepicker.data-api',
    '[data-provide="timepicker"]',
    function (e) {
      var $this = $(this);
      if ($this.data('timepicker'))
        return;
      e.preventDefault();
      // component click requires us to explicitly show it
      $this.timepicker('show');
    }
  );

  $(function () {
    $('[data-provide="timepicker"]').timepicker();
  });

})(jQuery);