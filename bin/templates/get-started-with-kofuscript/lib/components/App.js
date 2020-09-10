// Generated by KofuScript 0.0.3-alpha.7
var present = console.log;
// Generated by KofuScript 0.0.3-alpha.7
var Item, ItemView, List, list_view, ListView;
Item = require('./models/Item');
List = require('./collections/List');
ItemView = require('./views/ItemView');
ListView = (function(super$) {
	extends$(ListView, super$);
	function ListView() {
		super$.apply(this, arguments);
	}
	0;
	0;
	ListView.prototype.el = $('#app');
	ListView.prototype.initialize = function() {
		_.bindAll(this);
		this.collection = new List();
		this.collection.bind('add', this.appendItem);
		this.counter = 0;
		return this.render();
	};
	ListView.prototype.render = function() {
		this.el.addClass('container');
		this.el.append('<button id="trigger">Add List Item</button>');
		return this.el.append(
			'<h1 class="title">KofuScript With Backbone</h1><ul id="list"></ul>'
		);
	};
	ListView.prototype.addItem = function() {
		var item;
		this.counter++;
		item = new Item();
		item.set({ part2: '' + item.get('part2') + ' ' + this.counter });
		return this.collection.add(item);
	};
	ListView.prototype.appendItem = function(item) {
		var item_view;
		item_view = new ItemView({ model: item });
		return $('#list').append(item_view.render().el);
	};
	ListView.prototype.events = { 'click #trigger': 'addItem' };
	return ListView;
})(Backbone.View);
Backbone.sync = function(method, model, success, error) {
	return success();
};
list_view = new ListView();
function isOwn$(o, p) {
	return {}.hasOwnProperty.call(o, p);
}
function extends$(child, parent) {
	for (var key in parent) if (isOwn$(parent, key)) child[key] = parent[key];
	function ctor() {
		this.constructor = child;
	}
	ctor.prototype = parent.prototype;
	child.prototype = new ctor();
	child.__super__ = parent.prototype;
	return child;
}