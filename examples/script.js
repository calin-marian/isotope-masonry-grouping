(function($){
	$(document).ready(function(){
		$('#container').isotope({
    itemSelector : '.box',
		animationOptions: {
			duration: 400,
			easing: 'swing',
			queue: false
		},
		animationEngine: 'jquery',
		layoutMode: 'masonryGroups',
		masonryGroups: {
			columnWidthClass: 'box box-1x1',
			getGroupData: function($element) {
				return $element.data('group');
			},
			groups: {
				'block': {
					align: 'left',
					startNewRow: false,
				},
				'teaser': {
					align: 'none',
					startNewRow: false,
					groupBricks: false,
				},
				'content-image': {
					align: 'left',
					startNewRow: true,
					maxColumns: 8,
				},
				'content-description': {
					align: 'right',
					startNewRow: false,
					// position: {
					// 	col: 2,
					// 	row: 2,
					// },
				},
				'content-normal-fields': {
					align: 'none',
					startNewRow: true,
				},
				'content-menu': {
					align: 'right',
					startNewRow: false,
				}
			},
			fillInGroup: 'teaser',
		},
		filter: ':not(.isotope-hidden)',
		getSortData : {
			weight : function ($element) {
				return $element.data('weight');
			},
		},
		sortBy : 'weight',

		});
	});
})(jQuery)
