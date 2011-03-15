var months = ["January", "February", "March",
              "April", "May", "June",
              "July", "August", "September",
              "October","November", "December"];

/*
 * Date formatting code created from date.js, which is licensed under the following license:
 The MIT License (http://www.opensource.org/licenses/mit-license.php)

 Copyright (c) 2006-2008, Coolite Inc. (http://www.coolite.com/). All rights reserved.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions: 

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 See also:
 	http://www.datejs.com/license/
  	http://www.datejs.com/
	http://www.coolite.com/
 */

var ord = function (n) {
  switch (n * 1) {
   case 1: 
   case 21: 
   case 31: 
    return "st";
   case 2: 
   case 22: 
    return "nd";
   case 3: 
   case 23: 
    return "rd";
  default: 
    return "th";
  }
};

var p = function (s, l) {
  if (!l) {
    l = 2;
  }
  return ("000" + s).slice(l * -1);
};

Date.CultureInfo = {
  /* Culture Name */
  name: "en-US",
  englishName: "English (United States)",
  nativeName: "English (United States)",

  /* Day Name Strings */
  dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  shortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  firstLetterDayNames: ["S", "M", "T", "W", "T", "F", "S"],

  /* Month Name Strings */
  monthNames: ["January", "February", "March",
               "April", "May", "June",
               "July", "August", "September",
               "October", "November", "December"],
  abbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
};

Date.prototype.getUTCOffset = function() {
  var n = this.getTimezoneOffset() * -10 / 6, r;
  if (n < 0) { 
    r = (n - 10000).toString(); 
    return r.charAt(0) + r.substr(2); 
  } else { 
    r = (n + 10000).toString();  
    return "+" + r.substr(1); 
  }
};

Date.prototype.format = function(format_str) {
  var x = this;
  return format_str.replace(
      /(\\)?(dd?d?d?|HH|MM?M?M?|yy?y?y?|mm?|ss?|tt?|S|Z)/g, 
    function (m) {
      if (m.charAt(0) === "\\") {
        return m.replace("\\", "");
      }
      x.h = x.getHours;
      switch (m) {
       case "HH":
        return p(x.getHours());
       case "mm":
        return p(x.getMinutes());
       case "m":
        return x.getMinutes();
       case "ss":
        return p(x.getSeconds());
       case "s":
        return x.getSeconds();
       case "yyyy":
        return p(x.getFullYear(), 4);
       case "yy":
        return p(x.getFullYear());
       case "dddd":
        return Date.CultureInfo.dayNames[x.getDay()];
       case "ddd":
        return Date.CultureInfo.abbreviatedDayNames[x.getDay()];
       case "dd":
        return p(x.getDate());
       case "d":
        return x.getDate();
       case "MMMM":
        return Date.CultureInfo.monthNames[x.getMonth()];
       case "MMM":
        return Date.CultureInfo.abbreviatedMonthNames[x.getMonth()];
       case "MM":
        return p((x.getMonth() + 1));
       case "M":
        return x.getMonth() + 1;
       case "S":
        return ord(x.getDate());
       case "Z":
        return x.getUTCOffset();
      default: 
        return m;
      }
    });
};
  