(function () {
  'use strict';

  angular.module('ngQueryBuilder', [])
    .directive('queryBuilder', queryBuilder)
    .directive('queryBuilderGroup', queryBuilderGroup)
    .directive('attrs', attrs);

  function queryBuilder() {
    return {
      restrict: 'AE',
      scope: {
        options: '=queryBuilder',
        templateUrl: '=?',
        preset: '=?'
      },
      template: '<div query-builder-group="options" group="options._query.group"></div>',
      link: function (scope) {
        const defaults = {
          operators: [
            { name: 'AND', value: '$and' },
            { name: 'OR', value: '$or' },
          ],
          conditions: [
            { name: 'equal', value: '$eq' },
            { name: 'is not equal', value: '$neq' },
            { name: 'less than', value: '$lt' },
            { name: 'less than or equal', value: '$lte' },
            { name: 'greater than', value: '$gt' },
            { name: 'greater than or equal', value: '$gte' },
          ],
          templateUrl: scope.templateUrl,
        };

        scope.options = angular.extend({}, defaults, scope.options);

        scope.format = format;

        if(scope.options.preset){
          scope.options['_query'] = {
            group: scope.options.preset
          }
        }
        else{
          scope.options['_query'] = {
            group: {
              operator: scope.options.operators[0],
              rules: [],
            },
          };
        }

        function format(group) {
          const rulesWrapper = [];
          let operatorsWrapper = {};

          for (let i = 0; i < group.rules.length; i++) {
            operatorsWrapper[group.operator.value] = rulesWrapper;

            if (group.rules[i].group) {
              rulesWrapper.push(format(group.rules[i].group));
            }
            else {
              const el = {};
              el[group.rules[i].field.value] = {};
              el[group.rules[i].field.value][group.rules[i].condition.value] = group.rules[i].data;
              rulesWrapper.push(el);
            }
          }

          const firstKey = Object.keys(operatorsWrapper)[0];

          if (firstKey && operatorsWrapper[firstKey].length < 2) {
            operatorsWrapper = operatorsWrapper[firstKey].pop();
          }

          return operatorsWrapper;
        }

        scope.$watch('options._query', function (query) {
          scope.options.query = scope.format(query.group);
          scope.options.preset = query.group;
        }, true);
      },
    };
  }

  function queryBuilderGroup($compile) {
    'ngInject';

    return {
      restrict: 'AE',
      scope: {
        group: '=',
        options: '=queryBuilderGroup',
      },
      template: `<div class="m-10 border brad-5"> 
                  <div class="pv-10 pl-10">
                  <select class="p-10 mh-5 md" style="border: none;border-bottom: 1px solid lightgray !important" ng-options="o.name for o in options.operators track by o.value" ng-model="group.operator"></select>
                  <md-button ng-click="addCondition()" class="md-raised md-primary md-green-700-bg"><md-icon md-font-icon="icon-plus-circle" class="mr-5" style="font-size: 21px"></md-icon>Adicionar Condição</md-button>
                  <md-button ng-click="addGroup()" class="md-raised md-primary md-green-700-bg"><md-icon md-font-icon="icon-plus-circle" class="mr-5" style="font-size: 21px"></md-icon>Adicionar Grupo</md-button>
                  <md-button ng-click="removeGroup()" class="md-raised md-primary md-red-800-bg"><md-icon md-font-icon="icon-minus-circle" class="mr-5" style="font-size: 21px"></md-icon>Remover Grupo</md-button>
                  </div> 
                  <div class="pl-5 pb-5 query-builder-group" ng-show="group.rules.length > 0"> 
                  <div ng-repeat="rule in group.rules | orderBy:'index'" class="query-builder-condition"> 
                    <div ng-switch="rule.hasOwnProperty('group')">  
                    <div ng-switch-when="true">  
                      <div query-builder-group="options" group="rule.group"></div>  
                    </div> 
                    <div ng-switch-default> 
                      <div class="m-10 p-10 border brad-5 form-inline">  
                      <select ng-options="f.name for f in options.fields track by f.value" ng-model="rule.field" class="form-control input-sm p-10 mh-5" style="border: none;border-bottom: 1px solid lightgray !important"></select>  
                      <select ng-options="c.name for c in options.conditions track by c.value" ng-model="rule.condition" class="form-control input-sm p-10 mh-5" style="border: none;border-bottom: 1px solid lightgray !important"></select> 
                      <input type="number" ng-model="rule.data" class="form-control input-sm p-10 mh-5" attrs="rule.field.attrs" ng-if="rule.field.attrs.type == 'number'" style="border-bottom: 1px solid lightgray !important; border-top: none !important;border-left: none !important;border-right: none !important;" >  
                      <input type="text" ng-model="rule.data" class="form-control input-sm p-10 mh-5" attrs="rule.field.attrs" ng-if="rule.field.attrs.type == 'text'" style="border-bottom: 1px solid lightgray !important">                      
                      <select ng-model="rule.data" ng-if="rule.field.attrs.type == 'select'" style="border: none;border-bottom: 1px solid lightgray !important; height: 40px !important">
                        <option value="{{value.value}}" ng-repeat="value in rule.field.attrs.values">{{value.name}}</md-option>
                      </select>
                      <md-button ng-click="removeCondition($index)" class="md-raised md-primary md-red-800-bg"><md-icon md-font-icon="icon-minus-circle" class="mr-5"></md-icon>Remover Condição</md-button>  
                      </div> 
                    </div> 
                    </div> 
                  </div> 
                  </div> 
                </div>`,
      compile: function (tElement) {
        let compiledContents;
        const content = tElement.contents().remove();

        return function (scope, iElement) {
          scope.addCondition = addCondition;
          scope.removeCondition = removeCondition;
          scope.addGroup = addGroup;
          scope.removeGroup = removeGroup;
          scope.getTemplate = getTemplate;

          function addCondition() {
            scope.group.rules.push({
              condition: scope.options.conditions[0],
              field: scope.options.fields[0],
              data: '',
            });
          }

          function removeCondition(index) {
            scope.group.rules.splice(index, 1);
          } 

          function addGroup() {
            scope.group.rules.push({
              group: {
                operator: scope.options.operators[0],
                rules: [],
              },
            });
          }

          function removeGroup() {
            'group' in scope.$parent && scope.$parent.group.rules.splice(scope.$parent.$index, 1);
          }

          function getTemplate() {
            return scope.options.templateUrl || "./query-builder-group-directive.html";
          }

          if (!compiledContents) {
            compiledContents = $compile(content)
          }

          compiledContents(scope, function (clone) {
            iElement.append(clone);
          });
        }
      },
    };
  }

  function attrs() {
    return {
      restrict: 'A',
      scope: {
        list: '=attrs',
      },
      link: function (scope, element) {
        scope.$watch('list', function (list) {
          for (const attr in scope.list) {
            element.attr(attr, scope.list[attr]);
          }
        });
      },
    };
  }
})();
