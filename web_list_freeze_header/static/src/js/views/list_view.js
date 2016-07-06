
odoo.define('web_list_freeze_header.ListView', function (require) {
"use strict";

var core = require('web.core');
var data = require('web.data');
var DataExport = require('web.DataExport');
var formats = require('web.formats');
var common = require('web.list_common');
var Model = require('web.DataModel');
var pyeval = require('web.pyeval');
var session = require('web.session');
var Sidebar = require('web.Sidebar');
var utils = require('web.utils');
var View = require('web.View');

var ListView = require('web.ListView');

var Class = core.Class;
var _t = core._t;
var _lt = core._lt;
var QWeb = core.qweb;
var list_widget_registry = core.list_widget_registry;

/**
 * Serializes concurrent calls to this asynchronous method. The method must
 * return a deferred or promise.
 *
 * Current-implementation is class-serialized (the mutex is common to all
 * instances of the list view). Can be switched to instance-serialized if
 * having concurrent list views becomes possible and common.
 */
function synchronized(fn) {
    var fn_mutex = new utils.Mutex();
    return function () {
        var obj = this;
        var args = _.toArray(arguments);
        return fn_mutex.exec(function () {
            if (obj.isDestroyed()) { return $.when(); }
            return fn.apply(obj, args);
        });
    };
}

ListView.include({
	/**
     * re-renders the content of the list view
     *
     * @returns {$.Deferred} promise to content reloading
     */
    reload_content: synchronized(function () {
        var self = this;
        self.$el.find('.oe_list_record_selector').prop('checked', false);
        this.records.reset();
        var reloaded = $.Deferred();
        reloaded.then(function () {
            self.configure_pager(self.dataset);
        });
        this.$el.find('.oe_list_content').append(
            this.groups.render(function () {
                if (self.dataset.index === null) {
                    if (self.records.length) {
                        self.dataset.index = 0;
                    }
                } else if (self.dataset.index >= self.records.length) {
                    self.dataset.index = self.records.length ? 0 : null;
                }

                self.compute_aggregates();
                reloaded.resolve();
            }));
        this.do_push_state({
            page: this.page,
            limit: this._limit
        });
        
        return reloaded.promise();
    }),
    
    freeze_header: function() {
    	
    	// ADD new code to make the Header freeze
        if (this.options.action !== null &&
        		!$('div[id^="hdScroll"]').length &&
        		this.options.action.context['freeze_header'] !== 0) {
            
            var body_view = 0; //$('.oe_view_manager_body').last().outerHeight();
            _.each($('.oe-view-manager.oe_view_manager_current'), function(manager_body) {

            	body_view = (body_view < $(manager_body).outerHeight() ? $(manager_body).outerHeight() : body_view);
            })
            
            var search_view = 0; 
            if ($('.oe_searchview_drawer_container').is(':visible')) {
            	
            	_.each($('.oe_searchview_drawer_container'), function(searchview_drawer) {

            		search_view = (search_view < $(searchview_drawer).outerHeight() ? $(searchview_drawer).outerHeight() : search_view);
                })
            }
            
            var quick_add = $('.oe_quickadd.ui-toolbar').is(':visible') ? $('.oe_quickadd.ui-toolbar').outerHeight() : 0;
            
            var height_tree = body_view - search_view - quick_add - 8;
            
            $(".oe_list_content").freezeHeader({ 'height': height_tree.toString() + "px" });
        }
    },
});

});
