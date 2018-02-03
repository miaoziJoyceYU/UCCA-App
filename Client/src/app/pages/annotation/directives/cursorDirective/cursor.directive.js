(function() {
    'use strict';

    angular.module('zAdmin.annotation.directives')
        .directive('unitCursor',unitCursorDirective);

    /** @ngInject */
    function unitCursorDirective($rootScope,selectionHandlerService,HotKeysManager,DataService) {

        var directive = {
            restrict:'E',
            template:'<span class="unit-cursor" ng-class="{no_cursor:!vm.isCursorUnitClicked(vm,$parent.$index)}">|</span>',
            scope:{
                unitId:"="
            },
            link: unitCursorDirectiveLink,
            controller: unitCursorController,
            controllerAs: 'cursorCtrl',
            bindToController: true,
            replace:false,
            tokenClicked: false

        };

        return directive;

        function unitCursorDirectiveLink($scope, elem, attrs) {
            $scope.vm = $scope.cursorCtrl;
            $scope.vm.cursorLocation = 0;
            $scope.vm.cursorUpdated = false;

            $scope.$on('moveCursor', function(event, args) {

                if(args.parentId.toString() === $scope.vm.unitId.toString() ){

                    var unit = $('#unit-'+$scope.vm.unitId.toString());
                    var unitTokens = unit.find('.token-wrapper');


                    $scope.vm.cursorLocation = args.token.positionInUnit !== "Last" ? args.token.indexInParent : args.token.indexInParent+1;

                    $(elem).insertBefore( unitTokens[$scope.vm.cursorLocation] );


                }
            });

            $scope.$on('resetCursor_'+$scope.vm.unitId, function(event, args) {
                console.log("hey");

                var unit = $('#unit-'+$scope.vm.unitId.toString());
                var unitTokens = unit.find('.token-wrapper');
                $scope.vm.cursorLocation = 0;
                $(elem).insertBefore( unitTokens[$scope.vm.cursorLocation] );
            });

            $scope.$on('tokenIsClicked', function(event, args) {
                // var ctrlPressed = HotKeysManager.checkIfHotKeyIsPressed('ctrl');
                // var shiftPressed = HotKeysManager.checkIfHotKeyIsPressed('shift');

                if(args.token && args.parentId.toString() === $scope.vm.unitId.toString() ){
                    var unit = $('#unit-'+$scope.vm.unitId.toString());
                    var unitTokens = unit.find('.token-wrapper');
                    var unitNode = DataService.getUnitById(args.parentId);
                    var elementPos = unitNode.tokens.map(function(x) {return x.id; }).indexOf(args.token.id);
                    if(elementPos > -1){
                        !args.moveLeft ? $(elem).insertAfter( unitTokens[elementPos] ) : $(elem).insertBefore( unitTokens[elementPos] );
                        !args.moveLeft ? $scope.vm.cursorLocation = elementPos + 1 : $scope.vm.cursorLocation = elementPos;
                    }

                }
            });

            $scope.$on('moveRight', function(event, args) {
                var ctrlPressed = HotKeysManager.checkIfHotKeyIsPressed('ctrl');
                var shiftPressed = HotKeysManager.checkIfHotKeyIsPressed('shift');
                if(args.unitId === $scope.vm.unitId.toString()  && !$scope.vm.cursorUpdated){
                    var unit = $('#unit-'+$scope.vm.unitId.toString());
                    var unitTokens = unit.find('.token-wrapper');
                    if($scope.vm.cursorLocation <= unitTokens.length){
                        var tokenUnit = DataService.getUnitById(args.unitId);
                        if($scope.vm.cursorLocation < 0 || $scope.vm.cursorLocation > tokenUnit.tokens.length){
                            return;
                        }
                        var token = $scope.vm.cursorLocation == tokenUnit.tokens.length ? tokenUnit.tokens[$scope.vm.cursorLocation - 1] : tokenUnit.tokens[$scope.vm.cursorLocation];
                        if(shiftPressed){
                            $rootScope.$broadcast('tokenIsClicked',{token: token, parentId: $scope.vm.unitId, moveLeft: false});
                        }else{
                            $(elem).insertAfter( unitTokens[$scope.vm.cursorLocation] );
                            $scope.vm.cursorLocation++;
                            !ctrlPressed ? selectionHandlerService.clearTokenList() : $scope.vm.cursorUpdated = true;
                        }
                        var unitToCheckIn = DataService.getUnitById(args.unitId);

                        console.log(DataService.getUnitById(token.inUnit));


                        var sameParentTokens = unitToCheckIn.tokens.filter(function(element,index,array){
                            return element.inUnit == token.inUnit;
                        });

                        var nextToken = undefined;

                        if(sameParentTokens.length > 1){
                            for(var i=0; i< sameParentTokens.length; i++){
                                var currentToken = sameParentTokens[i];
                                if(currentToken.indexInParent != token.indexInParent){
                                    nextToken = currentToken;
                                }
                            }
                        }                        

                        //This is the last token
                        if(nextToken === undefined) return;

                        var unit = DataService.getUnitById(nextToken.inUnit);
                        // unitTokens = DataService.getUnitById(token.inUnit).tokens;
                        // if(unitTokens.length > 1){
                        //     var tokenPosition = unitTokens.map(function(x) {return x.id; }).indexOf(token.id);
                        //     if(tokenPosition !== unitTokens.length - 1){
                        //         nextToken = unitTokens[tokenPosition];
                        //     }

                        // }
                        if(token.inUnit === nextToken.inUnit && unit !== null && unit.annotation_unit_tree_id !== "0"){
                            if(unit.tokens === undefined){
                                unit.tokens = unit.tokenCopy;
                            }
                            if(shiftPressed){
                                unit.tokens.forEach(function(curr_token){
                                    $rootScope.$broadcast('tokenIsClicked',{token: curr_token, parentId: $scope.vm.unitId, moveLeft: false,doNotRemoveExistingToken: true});
                                })
                            }
                            var tokenPosition = unit.tokens.map(function(x) {return x.id; }).indexOf(token.id);
                            var sliceTokenArray = angular.copy(unit.tokens);
                            sliceTokenArray = sliceTokenArray.splice(tokenPosition,sliceTokenArray.length);
                            var elementPos = sliceTokenArray.map(function(x) {return x.positionInUnit; }).indexOf("Last");

                            if(elementPos === -1){
                                var firstAndLastPosition = 0;
                                for(var i=0; i<sliceTokenArray.length; i++){
                                    var current_token = sliceTokenArray[i];
                                    if(current_token.positionInUnit == "FirstAndLast"){
                                        firstAndLastPosition = i;
                                    }
                                }
                                elementPos = firstAndLastPosition;
                            }

                            var parentUnit = DataService.getParentUnit(unit.annotation_unit_tree_id);
                            elementPos = parentUnit.tokens.map(function(x) {return x.id; }).indexOf(sliceTokenArray[elementPos].id);

                            $scope.vm.cursorLocation = elementPos+1;
                            $scope.vm.cursorLocation === unitTokens.length ? $(elem).insertAfter( unitTokens[unitTokens.length - 1] ) : $(elem).insertBefore( unitTokens[$scope.vm.cursorLocation] );
                        }

                    }

                }else if($scope.vm.cursorUpdated){
                    $scope.vm.cursorUpdated = false;
                }
            });

            $scope.$on('moveLeft', function(event, args) {
                var ctrlPressed = HotKeysManager.checkIfHotKeyIsPressed('ctrl');
                var shiftPressed = HotKeysManager.checkIfHotKeyIsPressed('shift');
                if(args.unitId === $scope.vm.unitId.toString() &&  !$scope.vm.cursorUpdated){
                    var unit = $('#unit-'+$scope.vm.unitId.toString());
                    var unitTokens = unit.find('.token-wrapper');
                    var doNotRemoveExistingToken = false;
                    if($scope.vm.cursorLocation > 0){
                        $scope.vm.cursorLocation--;
                        var tokenUnit = DataService.getUnitById(args.unitId);
                        if($scope.vm.cursorLocation < 0 || $scope.vm.cursorLocation > tokenUnit.tokens.length){
                            return;
                        }
                        var token = $scope.vm.cursorLocation == tokenUnit.tokens.length ? tokenUnit.tokens[$scope.vm.cursorLocation -1] : tokenUnit.tokens[$scope.vm.cursorLocation];
                        if(shiftPressed){
                            $rootScope.$broadcast('tokenIsClicked',{token: token, parentId: $scope.vm.unitId, moveLeft: true});
                        }else{
                            $(elem).insertBefore( unitTokens[$scope.vm.cursorLocation] );
                            !ctrlPressed ? selectionHandlerService.clearTokenList() : $scope.vm.cursorUpdated = true;
                        }
                        // var prevToken = DataService.getUnitById(args.unitId).tokens[token.indexInParent-1];

                        var unitToCheckIn = DataService.getUnitById(args.unitId);

                        var sameParentTokens = unitToCheckIn.tokens.filter(function(element,index,array){
                            return element.inUnit == token.inUnit;
                        })

                        var prevToken = undefined;

                        if(sameParentTokens.length > 1){
                            for(var i=0; i< sameParentTokens.length; i++){
                                var currentToken = sameParentTokens[i];
                                if(currentToken.indexInParent != token.indexInParent){
                                    prevToken = currentToken;
                                }
                            }
                        }

                        //This is the last token
                        if(prevToken === undefined) return;

                        var unit = DataService.getUnitById(prevToken.inUnit);
                        if(token.inUnit === prevToken.inUnit && unit !== null && unit.annotation_unit_tree_id !== "0"){
                            if(unit.tokens === undefined){
                                unit.tokens = unit.tokenCopy;
                            }

                            if(shiftPressed){
                                unit.tokens.forEach(function(curr_token,index){
                                    $rootScope.$broadcast('tokenIsClicked',{token: curr_token, parentId: $scope.vm.unitId, moveLeft: false,doNotRemoveExistingToken: false});
                                })
                                $rootScope.$broadcast('tokenIsClicked',{token: token, parentId: $scope.vm.unitId, moveLeft: false,doNotRemoveExistingToken: false});
                            }

                            var tokenPosition = unit.tokens.map(function(x) {return x.id; }).indexOf(token.id);
                            var sliceTokenArray = angular.copy(unit.tokens);
                            sliceTokenArray = sliceTokenArray.splice(0,tokenPosition);
                            sliceTokenArray = sliceTokenArray.reverse();

                            var elementPos = sliceTokenArray.map(function(x) {return x.positionInUnit; }).indexOf("First");

                            if(elementPos === -1){
                                var firstAndLastPosition = 0;
                                for(var i=sliceTokenArray.length-1; i>=0; i--){
                                    var current_token = sliceTokenArray[i];
                                    if(current_token.positionInUnit == "FirstAndLast"){
                                        firstAndLastPosition = i;
                                    }
                                }
                                elementPos = firstAndLastPosition;
                            }

                            var parentUnit = DataService.getParentUnit(unit.annotation_unit_tree_id);
                            elementPos = parentUnit.tokens.map(function(x) {return x.id; }).indexOf(sliceTokenArray[elementPos].id);

                            $scope.vm.cursorLocation = elementPos;
                            $(elem).insertBefore( unitTokens[$scope.vm.cursorLocation] );
                        }
                    }
                }else if($scope.vm.cursorUpdated){
                    $scope.vm.cursorUpdated = false;
                }
            });
            
            $scope.$on('moveToNextRelevant', function(event, args) {
                var shiftPressed = HotKeysManager.checkIfHotKeyIsPressed('shift');
            	
                if(args.unitId === $scope.vm.unitId.toString()  && !$scope.vm.cursorUpdated){
                    var unit = $('#unit-'+$scope.vm.unitId.toString());
                    var unitTokens = unit.find('.token-wrapper');
                    
                    if($scope.vm.cursorLocation <= unitTokens.length){
                    	var tokenUnit = DataService.getUnitById(args.unitId);
                        if($scope.vm.cursorLocation < 0 || $scope.vm.cursorLocation > tokenUnit.tokens.length){
                            return;
                        }
                        var token = tokenUnit.tokens[$scope.vm.cursorLocation - 1];
                        
                        var oldUnit = token != undefined ? DataService.getUnitById(token.inUnit) : undefined;
                        var unitToCheckIn = tokenUnit;

                        var nextUnit = undefined;
                        var annotationUnits = unitToCheckIn.AnnotationUnits;
                        var tokens = unitToCheckIn.tokens;
                        if(shiftPressed){
                        	annotationUnits = annotationUnits.slice().reverse();
                        	tokens = tokens.slice().reverse();
                        }
                        var oldUnitIndex = oldUnit != undefined ? annotationUnits.map(function(x) {return x.annotation_unit_tree_id; }).indexOf(oldUnit.annotation_unit_tree_id) : undefined;
                        if(annotationUnits.length > 0 && oldUnitIndex != undefined){
                            for(var i=oldUnitIndex+1; i<annotationUnits.length; i++){
                                var currentUnit = annotationUnits[i];
                                if(!!currentUnit && !!currentUnit.categories && (!$rootScope.isRefinementLayerProject || currentUnit.categories[0].refinedCategory)){
                                	nextUnit = currentUnit;
                                	break;
                                }
                            }
                        }
                        
                        if(nextUnit === undefined) {
                        	var nextToken = undefined;
                        	if(tokens.length > 0){
                                for(var i=0; i< tokens.length; i++){
                                	var currentToken = tokens[i];
                                    var currentUnit = DataService.getUnitById(currentToken.inUnit);
                                    if(!!currentUnit && !!currentUnit.categories && (!$rootScope.isRefinementLayerProject || currentUnit.categories[0].refinedCategory)){
                                    	nextToken = currentToken;
                                    	nextUnit = currentUnit;
                                    	break;
                                    }
                                }
                            }
                        }
                        
                        //This is the last token
                        if(nextUnit === undefined) return;

                        var unit = nextUnit;
                        
                        
                        console.log(unit);
                        
                        if(unit !== null && unit.annotation_unit_tree_id !== "0"){
	                        if(unit.tokens === undefined){
	                            unit.tokens = unit.tokenCopy;
	                        }
	                        
//	                        if(!!oldUnit && (!oldUnit.parentUnitId || oldUnit.parentUnitId === "0")){
//	                        	oldUnit.gui_status = "HIDDEN";
//	                        }
	                        unit.gui_status = "OPEN";
	                        
	                        selectionHandlerService.clearTokenList();
	                        unit.tokens.forEach(function(curr_token){
	                            $rootScope.$broadcast('tokenIsClicked',{token: curr_token, parentId: $scope.vm.unitId, moveLeft: false, selectAllTokenInUnit: true});
	                        });
	
	                        $scope.vm.cursorLocation = unitToCheckIn.tokens.map(function(x) {return x.id; }).indexOf(unit.tokens[unit.tokens.length-1].id) + 1;
	                        $(elem).insertBefore( unitTokens[$scope.vm.cursorLocation] );
	                    }

                    }

                }else if($scope.vm.cursorUpdated){
	                    $scope.vm.cursorUpdated = false;
                }
            });
        }

        function unitCursorController() {
            var vm = this;
            vm.isCursorUnitClicked = isCursorUnitClicked;
        }

        function isCursorUnitClicked(vm){
            return selectionHandlerService.getSelectedUnitId() === vm.unitId.toString();
        }

    }

})();/**
 * Created by Nissan PC on 05/06/2017.
 */
