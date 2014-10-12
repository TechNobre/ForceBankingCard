/* ***************************************************

Plugin: Numeric only fields allowing decimal point

Options:
    align: Align text on input [ left | center | right ],
    length: Max length for input field [Integer number],
    separatorGroup: If existe decimal part [ true | false ],
    charSeparator: Character for separator group [ character ],
    digitsGroup: Number digits for group [Integer number],
    clearOnClick: If click in input clear field [ true | false ],
    cardsValidate: Card list for validade [ array | string ] { AmericanExpress | DinersClubCarteBlanche | JCB | Laser | VisaElectron | Visa | Dankort | InterPayment | MasterCard | Maestro | Discover },
    onSuccessValidate: Callback for card is valid [ function() {} ],
    onErrorValidate: Callback for card is not valid [ function() {} ],
    onkeyUp: Callback for keyUp [ function() {} ]

Defaults:
    align: 'left',
    length: null,
    separatorGroup: true,
    charSeparator: " ",
    digitsGroup: 4,
    clearOnClick: true,
    cardsValidate: null,
    onSuccessValidate: null,
    onErrorValidate: null,
    onkeyUp: null

Usage: $("element").ForceCardNumber();

Developer: Nelson Nobre

Date: 11/10/2014
Update: 12/10/2014

Version: 1.1
************************************************** */

; (function ($) {
    var pluginName = 'ForceCardNumber',
        _defaultsOptions = {
            align: 'left',
            length: null,
            separatorGroup: true,
            charSeparator: " ",
            digitsGroup: 4,
            clearOnClick: true,
            cardsValidate: null,
            onSuccessValidate: null,
            onkeyUp: null
        },
        cardsList = {
            AmericanExpress: {
                type: "CreditCard",
                regex: /^3[47]/,
                length: [15]
            },
            DinersClubCarteBlanche: {
                type: "CreditCard",
                regex: /^30[0-5]/,
                length: [14]
            },
            JCB: {
                type: "CreditCard",
                regex: /^35(2[89]|[3-8][0-9])/,
                length: [16]
            },
            Laser: {
                type: "CreditCard",
                regex: /^6(304|7(71|0[69]))/,
                length: [16, 17, 18, 19]
            },
            VisaElectron: {
                type: "DebitCard",
                regex: /^4(17500|(026|405|508|844|91[37]))/,
                length: [16]
            },
            Visa: {
                type: "CreditCard",
                regex: /^4/,
                length: [13, 16]
            },
            Dankort: {
                type: "CreditCard",
                regex: /^5019/,
                length: [16]
            },
            InterPayment: {
                type: "CreditCard",
                regex: /^636/,
                length: [16, 17, 18, 19]
            },
            MasterCard: {
                type: "CreditCard",
                regex: /^5[1-5]/,
                length: [16]
            },            
            Maestro: {
                type: "DebitCard",
                regex: /^(0604|5(0(18|20|38)|612|893)|6(3(04|90)|7(59|6[1-3])))/,
                length: [12, 13, 14, 15, 16, 17, 18, 19]
            },
            Discover: {
                type: "CreditCard",
                regex: /^6(011|5|4[4-9]|22(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]))/,
                length: [16]
            },
        };

    var methods = {
        init: function (options) {
            if (options) { options = $.extend({}, _defaultsOptions, options); }
            else { options = _defaultsOptions; }
            
            if(options.cardsValidate == null) {
                options.cardsValidate = [];
                for(var key in cardsList)
                    options.cardsValidate.push(key);
            } else if(typeof options.cardsValidate === "string") {
                if(!(options.cardsValidate in cardsList)) {
                    console.error("The type card is not supported;");
                    return false;
                }
                options.cardsValidate = [options.cardsValidate];
            } else if(Object.prototype.toString.call(options.cardsValidate) === '[object Array]') {
                for(var key in options.cardsValidate) {
                    if(!(options.cardsValidate[key] in cardsList)) {
                        console.error("The type card is not supported;");
                        return false;
                    }
                }
            } else
                console.error("The type is not supported for 'cardsValidate';")

            if(options.length == null || typeof options.length !== "number") {
                options.length = 0;
                for(var key in options.cardsValidate) {
                    if(maxInArray(cardsList[options.cardsValidate[key]].length) > options.length)
                        options.length = maxInArray(cardsList[options.cardsValidate[key]].length);
                }
            }
            
            /* Begin variables for status card */
                var valid, validCardType, validCardLength, validCardLuhn, cardNetwork, cardType;
            /* End variables for status card */

            function maxInArray(array) {
                return Math.max.apply(null, array);
            }            
            function checkLuhn(input) {
                var sum = 0;
                var numdigits = input.length;
                var parity = numdigits % 2;
                for(var count = 0; count < numdigits; count++) {
                    var digit = parseInt(input.charAt(count))
                    if(count % 2 == parity)
                        digit *= 2;
                    if(digit > 9)
                        digit -= 9;
                    sum += digit;
                }
                return (sum % 10) == 0;
            }
            
            function getStatusCard() {
                return {
                    Valid: valid,
                    ValidNumber: validCardLuhn,
                    ValidLength: validCardLength,
                    ValidType: validCardType,
                    CardType: cardType,
                    CardNetwork: cardNetwork
                };
            }
            
            return this.each(function() {
                var _me = $(this);
                
                _me.data("valid", false);
                _me.css("text-align", options.align);
                
                if (options.clearOnClick) _me.click(function() { _me.val(""); });

                _me.keydown(function (event) {
                    event.preventDefault();
                    
                    var key = event.charCode || event.keyCode || 0;
                    var valueInput = _me.val();
                    
                    var countCharSeparator = (valueInput.match(new RegExp(options.charSeparator, "g")) || []).length;
                    
                    if(key == 8) {
                        valueInput = valueInput.slice(0, valueInput.length-1);
                        if(valueInput.slice(-1) == options.charSeparator)
                            valueInput = valueInput.slice(0, valueInput.length-1);
                    }
                    
                    else if((key >= 48 && key <= 57) || (key >= 96 && key <= 105)) {
                        if((valueInput.length - countCharSeparator) < options.length) {
                            
                            if((valueInput.length - countCharSeparator) >= options.digitsGroup && options.separatorGroup) {
                                if((valueInput.length - countCharSeparator) % options.digitsGroup == 0)
                                    valueInput += options.charSeparator
                            }
                            if(key >= 48 && key <= 57)
                                valueInput += (key-48);
                            else if(key >= 96 && key <= 105)
                                valueInput += (key-96);
                        }
                    }
                    _me.val(valueInput);
                });

                _me.keyup(function() {
                    var _element = $(this);
                    var _inputValue = _element.val().replace(new RegExp(options.charSeparator, 'g'), '');
                                        
                    valid = false;
                    validCardType = false;
                    validCardLength = false;
                    validCardLuhn = false;
                    cardNetwork = undefined;
                    cardType = undefined;
    
                    for(var key in options.cardsValidate) {
                        if(_inputValue.match(cardsList[options.cardsValidate[key]].regex)) {
                            cardNetwork = options.cardsValidate[key];
                            break;
                        }                    
                    }
                    
                    var validLuhn = false;
                    if(options.cardsValidate.indexOf(cardNetwork) != -1) {
                        validCardType = true;
                        cardType = cardsList[cardNetwork].type;
                        
                        if(cardsList[cardNetwork].length.indexOf(_inputValue.length) != -1 )
                            validCardLength = true;
                        
                        validCardLuhn = checkLuhn(_inputValue);
                        valid = ((validCardType && validCardLength && validCardLuhn) ? true : false);

                        if(valid) {
                            if (options.onSuccessValidate && typeof options.onSuccessValidate == 'function') {
                                options.onSuccessValidate.call(this, getStatusCard());
                            }
                        } else {
                            if (options.onErrorValidate && typeof options.onErrorValidate == 'function') {
                                options.onErrorValidate.call(this, getStatusCard());
                            }
                        }
                    }
                    if (options.onkeyUp && typeof options.onkeyUp == 'function') {
                        options.onkeyUp.call(this, getStatusCard());
                    }
                    _element.data("valid", valid);
                });
                
            });
        }
    };

    // ***** Start: Supervisor *****
    $.fn[pluginName] = function (method) { //allow multiple element selection on same view
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist in jQuery.' + pluginName);
        }
    };
})(jQuery);