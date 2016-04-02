
var props = {
   audience: 'world'
};

var logger = {
   info: function(message) {
      if (arguments[1]) {
         console.info(message, arguments[1]);
      } else {
         console.info(message);
      }
   }
};

var metrics = {
   sum: function(name, value) {
      console.info('sum', {name, value});
   }
};

var context = {
   error: function(component, err) {
      console.error(err, component.name);
   }
};

function isClass(Class) {
   return /_class/.test(Function.prototype.toString.call(Class));
}

async function validateComponent(component) {
   console.info('validateComponent', component.name, Object.keys(component));
   if (!component) {
      throw 'component: empty';
   }
   if (!component.name) {
      throw 'component name: empty';
   }
   if (typeof component.start !== 'function') {
      throw 'component: start';
   }
   if (typeof component.end !== 'function') {
      throw 'component: end';
   }
   if (/^hello-component/.test(component.name)) {
      await component.start();
      await component.end();
   }
   console.info('OK', component.name);
}

export async function loadModule(componentModule) {
   const name = componentModule.match(/([^\/]+)$/)[1];
   console.log('loadModule', componentModule);
   let componentClass = require('./build/'+ componentModule);
   if (componentClass.default) {
      componentClass = componentClass.default;
   }
   if (typeof componentClass !== 'function') {
      throw 'componentClass ' + typeof componentClass;
   }
   //console.log('loadModule', typeof componentClass, isClass(componentClass), Object.keys(componentClass));
   const state = {name, props, logger, metrics, context};
   if (isClass(componentClass)) {
      const component = new componentClass(state);
      await component.init(state);
      await validateComponent(component);
      return component;
   } else {
      const component = await componentClass(state, props, logger, metrics, context);
      component.name = name;
      await validateComponent(component);
      return component;
   }
}
