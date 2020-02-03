(function($){
	$(document).ready(function(){
		$('#container').isotope({
		itemSelector : '.box',
		animationOptions: {
			duration: 400,
			easing: 'swing',
			queue: false
		},
		animationEngine: 'best-available',
		layoutMode: 'masonryGroups',
		masonryGroups: {
			columnWidthClass: 'box-1x1',
			getGroupData: function($element) {
				return $element.data('group');
			},
			groups: {
				'small': {
					align: 'none',
          startNewRow: false,
          groupBricks: false,
				},
				'large': {
					align: 'none',
					startNewRow: true,
          groupBricks: false,
          startCol: 1,
				},
			},
      fillInGroup: 'small',
      getSortData : {
        weight : function ($element) {
          return parseInt($element.data('weight'));
        },
      },
      sortBy : 'weight',
		},
		filter: ':not(.isotope-hidden)',
		});
	});
})(jQuery)
