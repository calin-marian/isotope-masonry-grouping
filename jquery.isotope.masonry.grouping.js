(function($){
	$.extend( $.Isotope.prototype, {
	    _getCenteredMasonryColumns : function() {
	        this.width = this.element.width();
	        var properties = this.options.masonryGroups;

	                      // i.e. options.masonryGroups && options.masonryGroups.columnWidth
	        var colW = properties && properties.columnWidth ||
	                      // or determine the with from the selector
	                      properties && properties.columnWidthClass && this._masonryGroupsGetColumnWidth() ||
                      	  // or use the size of the first item
                      	  this.$filteredAtoms.outerWidth(true) ||
	                      // if there's no items, use size of container
	                      this.width;

	        var cols = Math.floor( this.width / colW );
	        cols = Math.max( cols, 1 );

	        // i.e. this.masonryGroups.cols = ....
	        this.masonryGroups.cols = cols;
	        // i.e. this.masonryGroups.columnWidth = ...
	        this.masonryGroups.columnWidth = colW;
	    },

      	_masonryGroupsReset : function() {
        	// layout-specific props
        	this.masonryGroups = {};
        	// FIXME shouldn't have to call this again
        	this._getCenteredMasonryColumns();
        	var i = this.masonryGroups.cols;
        	this.masonryGroups.displayMap = [];
        	while (i--) {
          		this.masonryGroups.displayMap[i] = [0];
        	}
      	},

    	_masonryGroupsLayout : function( $elems ) {
	        var instance = this,
	            props = instance.masonryGroups,
	            defaults = {
	            	align: 'none',
	            	startNewRow: false,
	            };

	        // Get all the elements arranged into groups. 
	        if (this.options.masonryGroups.groups) {
				props.groups = [];
				var previousGroup = '';
				$elems.each(function () {
					var $this = $(this),
						groupName = instance.options.masonryGroups.getGroupData($this);

					if (previousGroup !== groupName) {
						props.groups.push({groupName: groupName, elems: []});
					}
					props.groups[props.groups.length - 1].elems.push($this);
					previousGroup = groupName;
				});
	        }

            // Lay the bricks group by group.
            while (props.groups.length) {
            	var currentGroup = props.groups.shift(),
            		groupOptions = $.extend(defaults, this.options.masonryGroups.groups[currentGroup.groupName]);
		        	displayMapY = props.displayMap.map(function(column, index){
						return column.reduce(function(previousValue, element){
							return previousValue + element;
						}, 0);
					}),
		        	minY = Math.min.apply(Math, displayMapY),
		        	maxY = Math.max.apply(Math, displayMapY),
            		startRow = (groupOptions.startNewRow ? maxY : minY) - 1;
            		// Make sure startRow is not negative.
            		if (!startRow) {
            			startRow = 0;
            		}

        		$.each(currentGroup.elems, function (index, value) {
		        	var $this  = $(this),
			            //how many columns does this brick span
			            colSpan = Math.ceil( $this.outerWidth(true) / props.columnWidth ),
			            rowSpan = Math.ceil( $this.outerHeight(true) / props.columnWidth ),
			            placed = false;
			        colSpan = Math.min( colSpan, props.cols );

			        // recalculate the min and max places occupied for each column.
		        	displayMapY = props.displayMap.map(function(column, index){
						return column.reduce(function(previousValue, element){
							return previousValue + element;
						}, 0);
					});
		        	minY = Math.min.apply(Math, displayMapY);
		        	maxY = Math.max.apply(Math, displayMapY);
			        
			        // First, try to find a position for the brick in the previous Rows
		        	for (var col = 0; col < props.cols - colSpan; col++) {
						for (var row = startRow; row < maxY - rowSpan + 1; row++) {
							if (!placed && instance._masonryGroupsFitsBrick(col, row, colSpan, rowSpan)) {
								instance._masonryGroupsPlaceBrick($this, col, row, colSpan, rowSpan);
								while (instance._masonryGroupsStartRowFull(startRow)) {
									startRow++;
								}
								placed = true; 
							}
						}
		        	};

		        	if (!placed) {
			        	//If we didn't place the brick in the previous rows, make room for
			        	//a new row in the map, and place the brick there
			        	for (var row = maxY; row < maxY + rowSpan; row++) {
			        		for (var col = 0; col < props.cols; col++) {
				        		props.displayMap[col][row] = 0;
			        		}
			        	}
			        	instance._masonryGroupsPlaceBrick($this, 0, maxY, colSpan, rowSpan);
		        	}

        		});
            }

      	},

        _masonryGroupsGetContainerSize : function() {
        	var unusedCols = 0,
            	i = this.masonryGroups.cols;
        	// count unused columns
        	while ( --i ) {
          		if ( this.masonryGroups.displayMap[i] !== 0 ) {
            		break;
          		}
          		unusedCols++;
        	}

        	return {
            	height : Math.max.apply( Math, this.masonryGroups.displayMap ),
            	// fit container to columns that have been used;
              	width : (this.masonryGroups.cols - unusedCols) * this.masonryGroups.columnWidth
            };
      	},

        _masonryGroupsResizeChanged : function() {
	        var prevColCount = this.masonryGroups.cols;
   		    // get updated colCount
        	this._getCenteredMasonryColumns();
        	return ( this.masonryGroups.cols !== prevColCount );
      	},

      	_masonryGroupsGetColumnWidth : function () {
		    var columnWidth = $('<div class="' + this.options.masonryGroups.columnWidthClass + ' temp-width-class"></div>').css({
		      position: "absolute",
		      left: -9999,
		    }).appendTo("body").outerWidth(true);
		    $('.temp-width-class').remove();
		  	
		  	return columnWidth;
		},

		_masonryGroupsFitsBrick : function(startColumn, startRow, colSpan, rowSpan) {
			var sum = 0;
			for (var row = startRow; row < (startRow + rowSpan); row++) {
			  	for (var column = startColumn; column < (startColumn + colSpan); column++) {
			    	sum = sum + this.masonryGroups.displayMap[column][row];
			  	};
			};
			return !sum;
		},

		_masonryGroupsStartRowFull : function(row) {
			var sum = 0;
			for (var column=0; column < this.masonryGroups.columns; column++) {
				sum = sum + this.masonryGroups.displayMap[column][row]
			}
			return sum == this.masonryGroups.columns;
		},

		_masonryGroupsPlaceBrick : function($brick, startColumn, startRow, colSpan, rowSpan) {
			for (var row = startRow; row < (startRow + rowSpan); row++) {
				for (var column = startColumn; column < (startColumn + colSpan); column++) {
					this.masonryGroups.displayMap[column][row] = 1;
				};
			};

			var x = startColumn * this.masonryGroups.columnWidth,
				y = startRow * this.masonryGroups.columnWidth;
			console.log({brick: $brick, x: x, y:y});

	      	this._pushPosition( $brick, x, y );
		}

	});
})(jQuery)