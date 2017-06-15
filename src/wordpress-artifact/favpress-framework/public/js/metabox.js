;(function($) {

	"use strict";

	var validation    = [];
	var bindings      = [];
	var items_binding = [];
	var dependencies  = [];

	$(document).on('click', '.favpress-wpa-group-title', function(e){
		e.preventDefault();
		var group     = $(this).parents('.wpa_group:first');
		var control   = group.find('.favpress-controls:first');
		var siblings  = group.siblings('.wpa_group:not(.tocopy)');
		var container = $('html, body');
		if(control.hasClass('favpress-hide'))
		{
			if(siblings.exists())
			{
				siblings.each(function(i, el){
					$(this).find('.favpress-controls').first().slideUp('fast', function() {
						$(this).addClass('favpress-hide')
						.slideDown(0, function(){
							if(i == siblings.length - 1)
							{
								control.slideUp(0,function() {
									$(this).removeClass('favpress-hide')
									.slideDown('fast');
								});
							}
						});
					});
				});
			}
			else
			{
				control.slideUp(0,function() {
					$(this).removeClass('favpress-hide')
					.slideDown('fast');
				});
			}
		}
		else
		{
			control.slideUp('fast', function() {
				$(this).addClass('favpress-hide')
				.slideDown(0);
			});
		}
		return false;
	});

	function favpress_init_fields($elements)
	{
		$elements.each(function(){
			if($(this).parents('.tocopy').length <= 0)
			{
				favpress.init_controls($(this));

				var id         = $(this).attr('id'),
					name       = $(this).attr('id'),
					rules      = $(this).attr('data-favpress-validation'),
					bind       = $(this).attr('data-favpress-bind'),
					items_bind = $(this).attr('data-favpress-items-bind'),
					dep        = $(this).attr('data-favpress-dependency'),
					type       = $(this).getDatas().type;

				// init validation
				rules && validation.push({name: id, rules: rules, type: type});
				// init binding
				if(typeof bind !== 'undefined' && bind !== false)
				{
					bind && bindings.push({bind: bind, type: type, source: id});
				}
				// init items binding
				if(typeof items_bind !== 'undefined' && items_bind !== false)
				{
					items_bind && items_binding.push({bind: items_bind, type: type, source: id});
				}
				// init dependancies
				if(typeof dep !== 'undefined' && dep !== false)
				{
					dep && dependencies.push({dep: dep, type: 'field', source: id});
				}
			}
		});
	}

	function favpress_init_groups($elements)
	{
		$elements.each(function(){
			if($(this).parents('.tocopy').length <= 0 && !$(this).hasClass('.tocopy'))
			{
				var dep  = $(this).attr('data-favpress-dependency'),
					type = $(this).getDatas().type,
					id   = $(this).attr('id');
				if(typeof dep !== 'undefined' && dep !== false)
				{
					dep && dependencies.push({dep: dep, type: 'section', source: id});
				}
			}
		});
	}

	function favpress_mb_sortable()
	{
		var textareaIDs = [];
		$('.wpa_loop.favpress-sortable').sortable({
			items: '>.wpa_group',
			handle: '.favpress-wpa-group-heading',
			axis: 'y',
			opacity: 0.5,
			tolerance: 'pointer',
			start: function(event, ui) { },
			stop: function(event, ui) { }
		});
	}

	$(document).ready(function () {
		favpress_init_fields(jQuery('.favpress-metabox .favpress-field'));
		favpress_init_groups(jQuery('.favpress-metabox .favpress-meta-group'));
		process_binding(bindings);
		process_items_binding(items_binding);
		process_dependency(dependencies);
		favpress_mb_sortable();
	});

	favpress.is_multianswer = function(type){
		var multi = ['favpress-checkbox', 'favpress-checkimage', 'favpress-multiselect'];
		if(jQuery.inArray(type, multi) !== -1 )
		{
			return true;
		}
		return false;
	};

	// image controls event bind
	favpress.custom_check_radio_event(".favpress-metabox", ".favpress-field.favpress-checkimage .field .input label");
	favpress.custom_check_radio_event(".favpress-metabox", ".favpress-field.favpress-radioimage .field .input label");

	// Bind event to WP publish button to process metabox validation
	$('#post').on( 'submit', function(e){

		var submitter = $("input[type=submit][clicked=true]"),
		    action    = submitter.val(),
		    errors    = 0;

		// update tinyMCE textarea content

		$('.favpress-field').removeClass('favpress-error');
		$('.validation-msg.favpress-error').remove();
		$('.favpress-metabox-error').remove();

		errors = favpress.fields_validation_loop(validation);

		if(errors > 0)
		{
			var $notif = $('<span class="favpress-metabox-error favpress-js-tipsy" original-title="' + errors + ' error(s) found in metabox"></span>');

			if(action === 'Save Draft')
			{
				$('#minor-publishing-actions .spinner, #minor-publishing-actions .ajax-loading').hide();
				$notif.tipsy();
				$notif.insertAfter('#minor-publishing-actions .spinner, #minor-publishing-actions .ajax-loading');
				$('#save-post').prop('disabled', false).removeClass('button-disabled');
			}
			else if(action === 'Publish' || action === 'Update')
			{
				$('#publishing-action .spinner, #publishing-action .ajax-loading').hide();
				$notif.tipsy();
				$notif.insertAfter('#publishing-action .spinner, #publishing-action .ajax-loading');
				$('#publish').prop('disabled', false).removeClass('button-primary-disabled');
			}

			var margin_top = Math.ceil((submitter.outerHeight() - $notif.height()) / 2);
			if(margin_top > 0)
				$notif.css('margin-top', margin_top);
			e.preventDefault();
			return;
		}

		// add hidden field before toggle to force submit
		$(this).find('.favpress-toggle .favpress-input').each(function(){
			var hidden = $('<input>', {type: 'hidden', name: this.name, value: 0});
			$(this).before(hidden);
		});

	});

	$("#post input[type=submit]").click(function() {
		$("input[type=submit]", $(this).parents("form")).removeAttr("clicked");
		$(this).attr("clicked", "true");
	});

	function process_binding(bindings)
	{
		for (var i = 0; i < bindings.length; i++)
		{
			var field   = bindings[i];
			var temp    = field.bind.split('|');
			var func    = temp[0];
			var dest    = temp[1];
			var ids     = [];

			var prefix  = '';
			prefix      = field.source.replace('[]', '');
			prefix      = prefix.substring(0, prefix.lastIndexOf('['));

			dest = dest.split(/[\s,]+/);

			for (var j = 0; j < dest.length; j++)
			{
				dest[j] = prefix + '[' + dest[j] + ']';
				ids.push(dest[j]);
			}

			for (j = 0; j < ids.length; j++)
			{
				favpress.binding_event(ids, j, field, func, '.favpress-metabox', 'metabox');
			}
		}
	}

	function process_items_binding(items_binding)
	{
		for (var i = 0; i < items_binding.length; i++)
		{
			var field   = items_binding[i];
			var temp    = field.bind.split('|');
			var func    = temp[0];
			var dest    = temp[1];
			var ids     = [];

			var prefix  = '';
			prefix      = field.source.replace('[]', '');
			prefix      = prefix.substring(0, prefix.lastIndexOf('['));

			dest = dest.split(/[\s,]+/);

			for (var j = 0; j < dest.length; j++)
			{
				dest[j] = prefix + '[' + dest[j] + ']';
				ids.push(dest[j]);
			}

			for (j = 0; j < ids.length; j++)
			{
				favpress.items_binding_event(ids, j, field, func, '.favpress-metabox', 'metabox');
			}
		}
	}

	function process_dependency(dependencies)
	{
		for (var i = 0; i < dependencies.length; i++)
		{
			var field  = dependencies[i];
			var temp   = field.dep.split('|');
			var func   = temp[0];
			var dest   = temp[1];
			var ids    = [];
			var prefix = '';

			if(field.type === 'field')
			{
				// strip [] (which multiple option field has)
				prefix = field.source.replace('[]', '');
				prefix = prefix.substring(0, prefix.lastIndexOf('['));
			}
			else if(field.type === 'section')
			{
				var $source = jQuery(favpress.jqid(field.source));
				if($source.parents('.wpa_group').length > 0)
				{
					prefix = jQuery(favpress.jqid(field.source)).parents('.wpa_group').first().attr('id');
				}
				else
				{
					// get the closest 'postbox' class parent id
					prefix = jQuery(favpress.jqid(field.source)).parents('.postbox').attr('id');
					// strip the '_metabox'
					prefix = prefix.substring(0, prefix.lastIndexOf('_'));
				}
			}

			dest = dest.split(',');

			for (var j = 0; j < dest.length; j++)
			{
				dest[j] = prefix + '[' + dest[j] + ']';
				ids.push(dest[j]);
			}

			for (j = 0; j < ids.length; j++)
			{
				favpress.dependency_event(ids, j, field, func, '.favpress-metabox');
			}
		}
	}

	$.wpalchemy.on('wpa_copy', function(event, clone){

		bindings      = [];
		dependencies  = [];
		items_binding  = [];

		// delete tocopy hidden field
		clone.find('input[class="tocopy-hidden"]').first().remove();

		favpress_init_fields(clone.find('.favpress-field'));
		favpress_init_groups(clone.find('.favpress-meta-group'));

		clone.find('.favpress-wpa-group-title:first').click();

		process_binding(bindings);
		process_items_binding(items_binding);
		process_dependency(dependencies);
	});

}(jQuery));