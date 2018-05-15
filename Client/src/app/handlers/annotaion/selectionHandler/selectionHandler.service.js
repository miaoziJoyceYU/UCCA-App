
/* Copyright (C) 2017 Omri Abend, The Rachel and Selim Benin School of Computer Science and Engineering, The Hebrew University. */
(function () {
    'use strict';

    angular.module('zAdmin.annotation.selectionHandler')
        .service('selectionHandlerService', selectionHandlerService);

    /** @ngInject */
    function selectionHandlerService(DataService, $rootScope,$q,Core, AssertionService) {
        trace("selectionHandlerService is here");
        var selectedTokenList = [];
        var selectedUnit = "0";
        var selectedToken = null;
        var tokenClicked = false;
        var selectionDirection = "DOWN";
        var unitToAddRemotes = "0";
        var categoryForRemote = [];
        var mouseDown = false;
        var lastSelectedToken = null;


        var _handler = {
            selectedTokenList: selectedTokenList,
            selectedUnit:selectedUnit,
            selectionDirection:selectionDirection,
            unitToAddRemotes:unitToAddRemotes,
            categoryForRemote:categoryForRemote,
            mouseDown: mouseDown,
            selectedToken: selectedToken,
            lastSelectedToken:lastSelectedToken,
            updateIndexInParentAttribute:updateIndexInParentAttribute,
            updatePositionInChildUnitAttribute:updatePositionInChildUnitAttribute,
            updateNextTokenNotAdjacent:updateNextTokenNotAdjacent,
            updateLastTokenNotAdjacent:updateLastTokenNotAdjacent,
            getTreeLastId:getTreeLastId,
            getSelectedTokenList: function(){
                trace("selectionHandlerService - getSelectedTokenList");
                return this.selectedTokenList;
            },
            isTokenClicked: function(){
                trace("selectionHandlerService - isTokenClicked");
                return this.tokenClicked;
            },
            setTokenClicked: function(){
                trace("selectionHandlerService - setTokenClicked");
                this.tokenClicked = true;
            },
            disableTokenClicked: function(){
                trace("selectionHandlerService - disableTokenClicked");
                this.tokenClicked = false;
            },
            setUnitToAddRemotes: function(id){
                trace("selectionHandlerService - setUnitToAddRemotes");
                this.unitToAddRemotes = id;
            },
            getUnitToAddRemotes: function(id){
                trace("selectionHandlerService - getUnitToAddRemotes");
                return this.unitToAddRemotes;
            },
            setSelectedToken: function(token){
                trace("selectionHandlerService - setSelectedToken");
                this.selectedToken = token;
            },
            getSelectedToken: function(){
                trace("selectionHandlerService - getSelectedToken");
                return this.selectedToken;
            },
            setLastInsertedToken: function(token){
                trace("selectionHandlerService - setLastInsertedToken");
                this.lastSelectedToken = token;
            },
            getLastInsertedToken: function(){
                trace("selectionHandlerService - getLastInsertedToken");
                return this.lastSelectedToken;
            },

            copyTokenToStaticFormat: function(token) {
                trace("selectionHandlerService - copyTokenToStaticFormat");
                var newFormatToken = {static: {}};
                Object.keys(token).forEach(function(key) {
                    if (DataService.baseTokenData.indexOf(key) > -1) {// Check if key exist in baseTokenData fields
                        newFormatToken.static[key] = token[key];
                        // delete token[key];
                    } else {
                        newFormatToken[key] = token[key];
                    }
                });
                return newFormatToken;
            },

            addTokenToList: function(token, selectedUnit, groupUnit){
                trace("selectionHandlerService - addTokenToList");
                /**
                 * Adds the token "token" into the list of selected tokens (selectedTokenList).
                 * If token is already selected, do nothing.
                 * If groupUnit is false, remove the token from unit tokens
                 * @type {Number}
                 */
                // debugger
                var elementPos = this.selectedTokenList.map(function(x) {return x.static.id; }).indexOf(token.static.id);
                if(elementPos === -1){
                    !groupUnit ? _handler.removeTokenFromUnitTokens(token) : ''; // this token is already in static format
                    // var copiedToken = angular.copy(token);
                    // var newFormatToken = _handler.copyTokenToStaticFormat(token);
                    this.selectedTokenList.push(token);
                    sortSelectedTokenList(this.selectedTokenList);
                }
                this.selectedUnit = selectedUnit;
            },
            setCategoryForRemote: function(category){
                trace("selectionHandlerService - setCategoryForRemote");
                this.categoryForRemote = [];
                this.categoryForRemote.push(category);
            },
            getCategoryForRemote: function(){
                trace("selectionHandlerService - getCategoryForRemote");
                return this.categoryForRemote;
            },
            clearCategoryForRemote: function(category){
                trace("selectionHandlerService - clearCategoryForRemote");
                this.categoryForRemote = [];
            },
            setSelectionDirection: function(mode){
                trace("selectionHandlerService - setSelectionDirection");
              this.selectionDirection = mode;
            },
            getSelectionDirection: function(mode){
                trace("selectionHandlerService - getSelectionDirection");
                return this.selectionDirection;
            },
            isTokenInList: function(token){
                trace("selectionHandlerService - isTokenInList");
                var elementPos = this.selectedTokenList.map(function(x) {return x.static.id; }).indexOf(token.static.id);
                return elementPos > -1;
            },
            removeTokenFromList: function(tokenId){
                trace("selectionHandlerService - removeTokenFromList");
                /**
                 * Unselect a token.
                 */
                var elementPos = this.selectedTokenList.map(function(x) {return x.static.id; }).indexOf(tokenId);
                //Omri: the next line is commented out as it doesn't do anything (Feb 11)
                //var objectFound = this.selectedTokenList[elementPos];
                // _handler.addTokenFromUnitTokens();
                this.selectedTokenList.splice(elementPos,1);
            },
            removeTokenFromUnitTokens: function(token){
                trace("selectionHandlerService - removeTokenFromUnitTokens");
                var unit = DataService.getUnitById(_handler.getSelectedUnitId());
                if(unit) {
                    /**
                     * If unit.tokens not exist, create it according to unit.tokenMap // tokens not exist in the beginning of initTree when tree_id='0'
                     */
                    if (!unit.tokens.length) {
                        unit.tokens = [];
                        for (var key in unit.tokenMap) {
                            // Push token to tokens list in static format
                            unit.tokens.push(_handler.copyTokenToStaticFormat(unit.tokenMap[key]));
                        }
                    }
                    var elementPos = unit.tokens.map(function(x) {return x.static.id; }).indexOf(token.static.id);
                    if(elementPos > -1){
                        var selectedUnitId = _handler.getSelectedUnitId();
                        var selectedUnit = DataService.getUnitById(selectedUnitId);
                        // Remove this block, with Omri, Feb 11
                        // if(selectedUnit.AnnotationUnits === undefined){
                        //     selectedUnit.AnnotationUnits = [];
                        // }
                        var tokenInUnit = _handler.isTokenInUnit(selectedUnit,token);
                        //old code line: (re-written as the if block below Feb 11)
                        // !tokenInUnit ? token['inChildUnitTreeId'] = selectedUnitId.toString() === "0" ? (selectedUnit.AnnotationUnits.length + 1).toString() : selectedUnit.tree_id !== "0" ? selectedUnit.tree_id + "-" +(selectedUnit.AnnotationUnits.length + 1).toString() : (selectedUnit.AnnotationUnits.length + 1).toString() : '';
                        //with Omri, Feb 11
                        if (!tokenInUnit) {
                            var newInUnitField = (selectedUnit.AnnotationUnits.length + 1).toString();
                            if (selectedUnitId.toString() != "0") {
                                newInUnitField = selectedUnitId + "-" + newInUnitField;
                            }
                            token['inChildUnitTreeId'] = newInUnitField;
                        }

                    }
                }
            },
            /**
             * Check if token exist in unit
             * @param selectedUnit
             * @param token
             * @returns {boolean} - if the token exist in the unit
             */
            isTokenInUnit: function(selectedUnit, token){
                trace("selectionHandlerService - isTokenInUnit");
                var tokenInUnit = false;
                for(var i=0; i<selectedUnit.AnnotationUnits.length; i++){
                    var tokenPosition = selectedUnit.AnnotationUnits[i].tokens.map(function(x) {return x.static.id; }).indexOf(token.static.id);
                    if(tokenPosition > -1){
                        tokenInUnit = true;
                        break;
                    }
                }
                // console.log("_________TokenInUnit=", tokenInUnit)
                return tokenInUnit;
            },

            clearTokenList: function(afterInsert){
                trace("selectionHandlerService - clearTokenList");
                // console.log("Token list cleared");

                if(!afterInsert){
                    _handler.getSelectedTokenList().forEach(function(token){
                        if(token.unitTreeId === undefined){
                            token.unitTreeId = "0";
                        }
                        var parentUnit = DataService.getUnitById(DataService.getParentUnitId(token.unitTreeId));
                        var elementPos = parentUnit.tokens.map(function(x) {return x.static.id; }).indexOf(token.static.id);
                        var tokenInUnit = false;
                        for(var i=0; i<parentUnit.AnnotationUnits.length; i++){
                            var tokenPosition = parentUnit.AnnotationUnits[i].tokens.map(function(x) {return x.static.id; }).indexOf(token.static.id);
                            if(tokenPosition > -1){
                                tokenInUnit = true;
                                break;
                            }
                        }
                        !tokenInUnit ? parentUnit.tokens[elementPos]['inChildUnitTreeId'] = null : '';
                    });
                }

                this.selectedTokenList = [];
            },


            updateSelectedUnit: function(index,afterInsert){
                trace("selectionHandlerService - updateSelectedUnit");
                /**
                 * Updates the focus unit.
                 * TODO: change the name selectedUnit to focusUnit
                 * @type {string}
                 */
                this.selectedUnit = index.toString();
                if(!_handler.isTokenClicked()){
                    _handler.clearTokenList(afterInsert);
                }
                _handler.disableTokenClicked();
                // // Check tree in AssertionService when update focus unit
                // AssertionService.checkTree(DataService.tree, DataService.serverData);
            },

            getSelectedUnitId: function(){
                trace("selectionHandlerService - getSelectedUnitId");
                return this.selectedUnit;
            },

            toggleMouseUpDown: function(){
                trace("selectionHandlerService - toggleMouseUpDown");
                this.mouseDown = !this.mouseDown;
            },

            getMouseMode: function(){
                trace("selectionHandlerService - getMouseMode");
                return this.mouseDown;
            },

            /**
             * Init tree when the annotation page is finish loading
             * @param data
             * @returns {*}
             */
            initTree: function(data){
                trace("selectionHandlerService - initTree");
                return $q(function(resolve, reject) {
                    // debugger
                    DataService.serverData.annotation_units.forEach(function(unit,index){

                        // Add this declaration with Omri Feb 11
                        unit.AnnotationUnits = [];

                        var tokenStack = [];
                        if(unit.type === "IMPLICIT"){
                            var objToPush = {
                                rowId : '',
                                text : '<span>IMPLICIT UNIT</span>',
                                numOfAnnotationUnits: 0,
                                categories:[],
                                comment:"",
                                cluster:"",
                                rowShape:'',
                                unitType:'IMPLICIT',
                                orderNumber: '-1',
                                gui_status:'OPEN',
                                usedAsRemote:[],
                                children_tokens:[],
                                containsAllParentUnits: false,
                                tokens:[{
                                    static: {
                                        "text": "IMPLICIT UNIT",
                                    },
                                    "unitTreeId":unit.parent_tree_id,
                                    "inChildUnitTreeId":null
                                }],
                                AnnotationUnits : [

                                ],
                                parent_tree_id: unit.parent_tree_id
                            };

                            /**
                             * insertToTree for implicit units
                             */
                            var newRowId = DataService.insertToTree(objToPush,unit.parent_tree_id,index != DataService.serverData.annotation_units.length -1);

                            unit.categories.forEach(function(category,index){
                                _handler.toggleCategory(DataService.hashTables.categoriesHashTable[category.id],unit.tree_id);
                                _handler.clearTokenList();
                            });

                        }else if(unit.is_remote_copy){// insertToTree for remote units

                            console.log("Init tree, unit is remote copy", unit);

                            DataService.unitType = 'REMOTE';

                            unit["tokens"] = [];

                            unit.unitType = "REMOTE";

                            unit.children_tokens.forEach(function(token){
                                unit["tokens"].push(_handler.copyTokenToStaticFormat(DataService.hashTables.tokensHashTable[token.id]));
                            });

                            // debugger
                            unit["children_tokens"] = unit["tokens"];

                            // unit["remote_original_id"] = angular.copy(unit.tree_id);

                            var unitCategory = unit.categories[0] ? DataService.hashTables.categoriesHashTable[ unit.categories[0].id] : null;

                            _handler.toggleCategory(unitCategory,null,unit,unit,index != DataService.serverData.annotation_units.length -1).then(function(res){
                                unit.categories.forEach(function(category,index){
                                    if(index === 0){

                                    }else{
                                        _handler.toggleCategory(DataService.hashTables.categoriesHashTable[category.id],res.id);
                                    }
                                    _handler.clearTokenList();
                                });
                            });


                            // if(unit.categories.length === 0){
                            //     _handler.toggleCategory(null,null,unit);
                            // }

                            DataService.unitType = 'REGULAR';

                            var unitToAddTo = DataService.getUnitById(unit.tree_id);

                            if(unitToAddTo){
                                if(unitToAddTo.usedAsRemote === undefined){
                                    unitToAddTo["usedAsRemote"] = [];
                                }

                                debugger
                                var remotePosition = DataService.getUnitById(unit.remote_original_id).AnnotationUnits.map(function(x) {return x.id; }).indexOf(unit.id);
                                if(remotePosition > -1){
                                    unitToAddTo["usedAsRemote"].push(DataService.getUnitById(unit.parent_tree_id).AnnotationUnits[remotePosition].tree_id);
                                }else{
                                    unitToAddTo["usedAsRemote"].push(unit.parent_tree_id + "-" + DataService.getUnitById(unit.parent_tree_id).AnnotationUnits.length);
                                }
                            }

                            if(DataService.unitsUsedAsRemote[unit.tree_id] === undefined){
                                DataService.unitsUsedAsRemote[unit.tree_id] = {};
                            }

                            var parentUnitUnits = DataService.getUnitById(unit.tree_id);
                            var amountOfRemotes = 0;
                            if (parentUnitUnits) { // TODO: remove this line, added this condition because sometimes parentUnitUnits was undefined
                                parentUnitUnits.AnnotationUnits.forEach(function (unit) {
                                    if (unit.unitType === "REMOTE") {
                                        amountOfRemotes++;
                                    }
                                });
                            }

                            DataService.unitsUsedAsRemote[unit.tree_id][unit.parent_tree_id + "-" + parseInt(parseInt(amountOfRemotes+1))] = true;
                            // console.log("In initTree, unitsUsedAsRemote=", DataService.unitsUsedAsRemote);



                            // selectionHandlerService.setUnitToAddRemotes("0");
                            $('.annotation-page-container').toggleClass('crosshair-cursor');

                        }else if(unit.tree_id !== "0"){
                            unit.children_tokens.forEach(function(token){
                                // debugger
                                var parentId = unit.tree_id.length === 1 ? "0" : unit.tree_id.split("-").slice(0,unit.tree_id.split("-").length-1).join("-");
                                _handler.addTokenToList(_handler.copyTokenToStaticFormat(DataService.hashTables.tokensHashTable[token.id]), parentId)
                            });
                            if(unit.categories.length === 0){
                                _handler.toggleCategory(null,false,unit.is_remote_copy,unit,true);
                            }else{
                                _handler.toggleCategory(DataService.hashTables.categoriesHashTable[unit.categories[0].id],false,false,unit,true)
                                    .then(function(){
                                        unit.categories.forEach(function(category,index){
                                            if(index === 0){
                                                // _handler.toggleCategory(DataService.hashTables.categoriesHashTable[category.id],false,false,unit.gui_status);
                                            }else{
                                                _handler.toggleCategory(DataService.hashTables.categoriesHashTable[category.id],unit.tree_id,false);
                                            }
                                            _handler.clearTokenList();
                                        });
                                    });
                            }

                            _handler.clearTokenList();
                        }

                    });
                    DataService.unitType = 'REGULAR';
                    // after init the tree, is it needed?
                    // DataService.sortAndUpdate();
                    _handler.updateSelectedUnit("0",false);

                    // Check tree in AssertionService at the end of init tree
                    // debugger
                    AssertionService.checkTree(DataService.tree, DataService.serverData);
                    return resolve({status: 'InitTreeFinished'});
                })
            },

            toggleCategory: function(category,justToggle,remote,unit,inInitStage){
                /**
                 * toggleCategory is also responsible for creating new units which are assigned a category.
                 */
                trace("selectionHandlerService - toggleCategory");
                return $q(function(resolve, reject) {
                    if(_handler.selectedTokenList.length > 0 && newUnitContainAllParentTokensTwice(_handler.selectedTokenList) || checkifThereIsPartsOFUnitTokensInsideList(_handler.selectedTokenList,inInitStage)){
                        return
                    }

                    if(!aUnitIsSelected(_handler.selectedTokenList,inInitStage) && (_handler.selectedTokenList.length && !justToggle) || remote || inInitStage){
                        //_handler mean we selected token and now we need to create new unit.

                        updateIndexInParentAttribute(_handler.selectedTokenList);
                        updatePositionInChildUnitAttribute(_handler.selectedTokenList);
                        updateNextTokenNotAdjacent(_handler.selectedTokenList);
                        updateLastTokenNotAdjacent(_handler.selectedTokenList);

                        var newUnit = {
                            tokens : angular.copy(_handler.selectedTokenList),
                            categories:[],
                            gui_status:unit ? unit.gui_status : "OPEN",
                            comment: unit ? unit.comment : '',
                            cluster: unit ? unit.cluster : '',
                            tree_id: unit && unit.tree_id ? unit.tree_id : null,
                            parent_tree_id: unit && unit.parent_tree_id ? unit.parent_tree_id : null,
                            is_remote_copy: unit && unit.is_remote_copy ? unit.is_remote_copy : false,
                            cloned_from_tree_id: unit && unit.cloned_from_tree_id ? unit.cloned_from_tree_id : null
                        };
                        if(remote){
                            newUnit = angular.copy(remote);
                            var tempCat = angular.copy(newUnit.categories[0]);
                            newUnit.categories = [];
                            tempCat !== undefined ? newUnit.categories.push(DataService.hashTables.categoriesHashTable[tempCat.id]) : '';

                            _handler.selectedUnit = newUnit.parent_tree_id;

                        }

                        category !== null && !remote ? newUnit.categories.push(angular.copy(category)) : '';
                        /**
                         * InsertToTree for regular (non-implicit) units
                         */
                        return DataService.insertToTree(newUnit,_handler.selectedUnit,inInitStage).then(function(res){
                            if(res.status === "InsertSuccess"){

                                _handler.updateSelectedUnit(res.id,true);
                                
                                Core.scrollToUnit(res.id);
                                
                                // _handler.clearTokenList();
                                return resolve({id: res.id});
                                // return res.id;
                            }
                        });
                    }else{
                        if(justToggle){
                            _handler.updateSelectedUnit(justToggle);
                        }
                        //Toggle the category for existing unit
                        if(_handler.selectedUnit.toString() !== "0"){
                            return DataService.toggleCategoryForUnit(_handler.selectedUnit,category).then(function(res){
                                if(res.status === "ToggleSuccess"){
                                    _handler.updateSelectedUnit(res.id);
                                    _handler.clearTokenList();
                                    // return res.id;
                                    return resolve({id: res.id});
                                }
                            })
                        }
                    }
                    // Check tree in AssertionService after toggle category
                    AssertionService.checkTree(DataService.tree, DataService.serverData);

                    $rootScope.$broadcast("ResetSuccess");
                })
            }
        };

        function checkifThereIsPartsOFUnitTokensInsideList(selectedTokenList,inInitStage){
            trace("selectionHandlerService - checkifThereIsPartsOFUnitTokensInsideList");
            if(inInitStage){
                return false;
            }
            //Checks if the new unit contains only parts of existing units. if so, block the unit insertion.
            var result = false;
            var unitsObject = {};

            selectedTokenList.forEach(function(token){

                if(token.inChildUnitTreeId !== null && DataService.getUnitById(token.inChildUnitTreeId) !== null){
                    var existingUnit = DataService.getUnitById(token.inChildUnitTreeId);
                    var sumOfTokenInList = selectedTokenList.filter(function(tokenInList) {
                        return tokenInList.inChildUnitTreeId === token.inChildUnitTreeId ;
                    });

                    if(sumOfTokenInList.length !== existingUnit.tokens.length){
                        result = true;
                    }

                }
            })

            return result;
        }

        function newUnitContainAllParentTokensTwice(selectedTokenList){
            trace("selectionHandlerService - newUnitContainAllParentTokensTwice");
            var currentUnit = DataService.getUnitById(selectedTokenList[0].unitTreeId);

            if(currentUnit.tree_id !== "0"){
                var parentUnit = DataService.getUnitById(DataService.getParentUnitId(currentUnit.tree_id));

                return compareUnitsTokens(selectedTokenList,currentUnit.tokens) && compareUnitsTokens(currentUnit.tokens,parentUnit.tokens);
            }

        }

        function compareUnitsTokens(unitATokens,unitBTokens){
            trace("selectionHandlerService - compareUnitsTokens");
            var result = true;
            if(unitATokens.length === unitBTokens.length){
                unitATokens.forEach(function(token){
                    var elementPos = unitBTokens.map(function(x) {return x.static.id; }).indexOf(token.static.id);
                    if(elementPos === -1){
                        result = false;
                    }
                })
            }else{
                result = false;
            }
            return result;
        }

        function aUnitIsSelected(selectedTokenList,inInitStage){
            trace("selectionHandlerService - aUnitIsSelected");
            var result = true;
            var unitId = null;

            if(selectedTokenList.length === 0){
                return false;
            }
            unitId = selectedTokenList[0].inChildUnitTreeId;

            if(unitId === null){
                return false;
            }
            selectedTokenList.forEach(function(token){
                if(unitId !== token.inChildUnitTreeId){
                    result = false;
                }
            });

            if(!result ){
                return false
            }

            var tokenInUnit = selectedTokenList[0].inChildUnitTreeId;
            tokenInUnit && DataService.getUnitById(tokenInUnit) && !inInitStage ? _handler.updateSelectedUnit(tokenInUnit) : '';
            return DataService.getUnitById(tokenInUnit);
        }

        function updateIndexInParentAttribute(selectedTokenList){
            trace("selectionHandlerService - updateIndexInParentAttribute");
            selectedTokenList.forEach(function(token,index){
                var parentUnitTokens;
                if(token.unitTreeId){
                    if(DataService.getUnitById(token.unitTreeId) && DataService.getUnitById(token.unitTreeId).tokens){
                        parentUnitTokens = DataService.getUnitById(token.unitTreeId).tokens;
                    }else{
                        return;
                    }
                }else{
                    parentUnitTokens = DataService.getUnitById("0").tokens;
                }
                var elementPos = parentUnitTokens.map(function(x) {return x.static.id; }).indexOf(token.static.id);
                if(elementPos > -1){
                    token['indexInUnit'] = elementPos;
                }
            })
        }

        function updatePositionInChildUnitAttribute(selectedTokenList){
            trace("selectionHandlerService - updatePositionInChildUnitAttribute");
            selectedTokenList.forEach(function(token,index){
                if(selectedTokenList.length === 1){
                    token['positionInChildUnit'] = 'FirstAndLast';
                }else if(index === 0){
                    token['positionInChildUnit'] = 'First';
                }else if(index === selectedTokenList.length-1){
                    token['positionInChildUnit'] = 'Last';
                }else{
                    token['positionInChildUnit'] = 'Middle';
                }
            })
        }

        function updateNextTokenNotAdjacent(selectedTokenList){
            trace("selectionHandlerService - updateNextTokenNotAdjacent");
            selectedTokenList.forEach(function(token,index){
                if(index === selectedTokenList.length-1 || token.indexInUnit + 1 === selectedTokenList[index+1].indexInUnit){
                    token['nextTokenNotAdjacent'] = false;
                }else if(token.indexInUnit + 1 !== selectedTokenList[index+1].indexInUnit){
                    token['nextTokenNotAdjacent'] = true;
                }
            })
        }
        
        function updateLastTokenNotAdjacent(selectedTokenList){
            trace("selectionHandlerService - updateLastTokenNotAdjacent");
            selectedTokenList.forEach(function(token,index){
                if(index === 0 || token.indexInUnit - 1 === selectedTokenList[index-1].indexInUnit){
                    token['lastTokenNotAdjacent'] = false;
                }else if(token.indexInUnit - 1 !== selectedTokenList[index-1].indexInUnit){
                    token['lastTokenNotAdjacent'] = true;
                }

                if(token["positionInChildUnit"] === "First" && token['nextTokenNotAdjacent']){
                    token['positionInChildUnit'] = 'FirstAndLast';
                }
                if(token["positionInChildUnit"] === "Last" && token['lastTokenNotAdjacent']){
                    token['positionInChildUnit'] = 'FirstAndLast';
                }
                if(token["positionInChildUnit"] === "Middle" && token['lastTokenNotAdjacent'] && token['nextTokenNotAdjacent']){
                    token['positionInChildUnit'] = 'FirstAndLast';
                }
                if(token["positionInChildUnit"] === "Middle" && token['lastTokenNotAdjacent']){
                    token['positionInChildUnit'] = 'First';
                }
                if(token["positionInChildUnit"] === "Middle" && token['nextTokenNotAdjacent']){
                    token['positionInChildUnit'] = 'Last';
                }

            })

        }

        function sortSelectedTokenList(selectedTokenList){
            trace("selectionHandlerService - sortSelectedTokenList");
            selectedTokenList.sort(function(a,b){
                if(a.static.start_index > b.static.start_index){
                    return 1;
                }else if(a.static.start_index < b.static.start_index){
                    return -1;
                }else{
                    return 0;
                }
            })
        }
        
        function getTreeLastId(currentUnit){
            trace("selectionHandlerService - getTreeLastId");
            if(currentUnit.AnnotationUnits.length == 0){
               return currentUnit.tree_id;
            }
            
            var lastChild =  currentUnit.AnnotationUnits[ currentUnit.AnnotationUnits.length - 1 ];
            return getTreeLastId(lastChild);
        }
        
        return _handler;
    }

})();
