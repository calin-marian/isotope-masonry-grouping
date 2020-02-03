(function($){
  $.extend( $.Isotope.prototype, {
      _getCenteredMasonryColumns : function() {
          $(this.element).css("width", "");
          this.width = this.element.width();
          var properties = this.options.masonryGroups;

          // determine column width
          var colW = properties && properties.columnWidth ||
                     // or determine the with from the selector
                     properties && properties.columnWidthClass && this._masonryGroupsGetColumnWidth() ||
                     // or use the size of the first item
                     this.$filteredAtoms.outerWidth(true) ||
                     // if there's no items, use size of container
                     this.width;

          // determine column height
          var colH = properties && properties.columnHeight ||
                     // or determine the with from the selector
                     properties && properties.columnWidthClass && this._masonryGroupsGetColumnHeight() ||
                     // or use the size of the first item
                     this.$filteredAtoms.outerHeight(true) ||
                     // if there's no items, use size of container
                     this.height;

          var cols = Math.floor( this.width / colW );
          cols = Math.max( cols, 1 );

          // save column count in the instance.
          this.masonryGroups.cols = cols;
          // save the column width in the instance
          this.masonryGroups.columnWidth = colW;
          // save the column height in the instance
          this.masonryGroups.columnHeight = colH;
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
              groupBricks: true,
              maxColumns: props.cols,
              startCol: false,
              position: false,
            };

        // Get all the elements arranged into groups.
        if (this.options.masonryGroups.groups) {
          props.clusters = [];
          var previousGroup = '';
          $elems.each(function () {
            var $this = $(this),
                groupName = instance.options.masonryGroups.getGroupData($this);

            if (previousGroup !== groupName) {
              props.clusters.push({groupName: groupName, elems: []});
            }

            props.clusters[props.clusters.length - 1].elems.push($this);
            previousGroup = groupName;
          });
        }

        // Move the clusters that have position to the begining of the list
        var positionClusters = [];
        var freeClusters = [];
        $.each(props.clusters, function(index, cluster) {
          var clusterDefaults = $.extend(true, {}, defaults);
          var clusterOptions = $.extend(clusterDefaults, instance.options.masonryGroups.groups[cluster.groupName]);
          if (clusterOptions.position || (clusterOptions.startCol !== false)) {
            positionClusters.push(cluster);
          }
          else {
            freeClusters.push(cluster);
          }
        });

        props.clusters = positionClusters.concat(freeClusters);

        // Lay the bricks cluster by cluster.
        while (props.clusters.length) {
          var currentCluster = props.clusters.shift(),
              clusterDefaults = $.extend(true, {}, defaults),
              clusterOptions = $.extend(clusterDefaults, this.options.masonryGroups.groups[currentCluster.groupName]),
              displayMapY = props.displayMap.map(function(column, index){
                return column.reduce(function(previousValue, element){
                  return previousValue + element;
                }, 0);
              }),
              minY = 0, //Math.min.apply(Math, displayMapY),
              maxY = Math.max.apply(Math, displayMapY),
              options = {
                startRow: (clusterOptions.startNewRow ? maxY : minY),
              };


          $.each(currentCluster.elems, function (index, value) {
            var $this  = $(this),
                //how many columns does this brick span
                colSpan = Math.ceil( (instance._masonryGroupsGetWidth($this.get(0)) / props.columnWidth).toFixed(3) ),
                rowSpan = Math.ceil( (instance._masonryGroupsGetHeight($this.get(0)) / props.columnHeight).toFixed(3) ),
                placed = false;

            console.log({
              element: this,
              width: instance._masonryGroupsGetWidth($this.get(0)),
              height: instance._masonryGroupsGetHeight($this.get(0)),
              colSpan: instance._masonryGroupsGetWidth($this.get(0)) / props.columnWidth,
              rowSpan: instance._masonryGroupsGetHeight($this.get(0)) / props.columnHeight,
              columnWidth: props.columnWidth,
              columnHeight: props.columnHeight
            });

            // Make sure colSpan is not greater then the number of columns we
            // have available.
            colSpan = Math.min( colSpan, props.cols );

            // recalculate the min and max places occupied for each column.
            displayMapY = props.displayMap.map(function(column, index){
              return column.reduce(function(previousValue, element){
                return previousValue + element;
              }, 0);
            });
            minY = 0, //Math.min.apply(Math, displayMapY);
            maxY = Math.max.apply(Math, displayMapY);

            // determine iteration variables based on group alignment.
            options.iteration = instance._masonryGroupsIterations(clusterOptions, clusterOptions.startCol || 0, props.cols, colSpan);
            options.brick = $this;
            options.colSpan = colSpan;
            options.rowSpan = rowSpan;

            if (clusterOptions.position) {
              placed = placed || instance._masonryGroupsAttemptToPlaceBrick(clusterOptions.position.col, clusterOptions.position.row, options);
            }

            // If the cluster is grouped, try to find a position for the brick
            // in the cluster Rows.
            if (clusterOptions.groupBricks) {
              options.maxRow = maxY - rowSpan;
              placed = placed || instance._masonryGroupsSearchBrickSpaceByColumn(options);

            }

            // If brick is not placed, try to find a position for the brick in
            // the previous Rows.
            options.maxRow = maxY;
            placed = placed || instance._masonryGroupsSearchBrickSpaceByRow(options);

            // If we didn't place the brick in the previous rows, make room for
            // a new row in the map, and place the brick there.
            if (!placed) {
              for (var row = maxY; row <= maxY + rowSpan; row++) {
                for (var col = 0; col < props.cols; col++) {
                  props.displayMap[col][row] = 0;
                }
              }
              instance._masonryGroupsPlaceBrick($this, options.iteration.start, maxY, colSpan, rowSpan);
            }

          });
        }

      },

      _masonryGroupsGetContainerSize : function() {
        var self = this;
        var unusedCols = 0,
            i = this.masonryGroups.cols;

        // count unused columns
        // while ( --i ) {
        //   if ( this.masonryGroups.displayMap[i] !== 0 ) {
        //     break;
        //   }
        //   unusedCols++;
        // }

        var displayMapY = self.masonryGroups.displayMap.map(function(column, index){
                return column.reduce(function(previousValue, element){
                  return previousValue + element;
                }, 0);
              });

        return {
          height : Math.max.apply( Math, displayMapY ) * this.masonryGroups.columnHeight,
          // fit container to columns that have been used;
          width : '100%'
        };
      },

      _masonryGroupsResizeChanged : function() {
        // get updated colCount
        this._getCenteredMasonryColumns();
        return true;
      },

      _masonryGroupsGetColumnWidth : function () {
        return this._masonryGroupsGetWidth($('.' + this.options.masonryGroups.columnWidthClass).get(0));
      },

      _masonryGroupsGetColumnHeight : function () {
        return this._masonryGroupsGetHeight($('.' + this.options.masonryGroups.columnWidthClass).get(0));
      },

      _masonryGroupsGetWidth : function (element) {
        var rect = element.getBoundingClientRect();

        if (rect.width) {
          // `width` is available for IE9+
          return rect.width;
        }

        // Calculate width for IE8 and below
        return rect.right - rect.left;
      },

      _masonryGroupsGetHeight : function (element) {
        var rect = element.getBoundingClientRect();

        if (rect.height) {
          // `height` is available for IE9+
          return rect.height;
        }

        // Calculate height for IE8 and below
        return rect.bottom - rect.top;
      },

      _masonryGroupsFitsBrick : function(startColumn, startRow, colSpan, rowSpan) {
        var sum = 0;
        for (var row = startRow; row < (startRow + rowSpan); row++) {
            for (var column = startColumn; column < (startColumn + colSpan); column++) {
              sum = sum + this._masonryGroupsGetMapValue(column, row);
            };
        };
        return !sum;
      },

      _masonryGroupsStartRowFull : function(row) {
        var sum = 0;
        for (var column=0; column < this.masonryGroups.columns; column++) {
          sum = sum + this._masonryGroupsGetMapValue(column, row);
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
            y = startRow * this.masonryGroups.columnHeight;

        this._pushPosition( $brick, x, y );
      },

      _masonryGroupsIterations : function(clusterOptions, min, max, colSpan) {
        if (clusterOptions.maxColumns != max) {
          min = clusterOptions.align == 'right' ? max - clusterOptions.maxColumns : min;
          max = clusterOptions.align == 'right' ? max : min + clusterOptions.maxColumns;
        }
        var increaseEndCondition = function(index) {
              return index <= max - colSpan;
            },
            decreaseEndCondition = function(index) {
              return index >= min;
            };

        return {
          start: clusterOptions.align == 'right' ? max - colSpan : min,
          conditionCallback: clusterOptions.align == 'right' ? decreaseEndCondition : increaseEndCondition,
          increment: clusterOptions.align == 'right' ? -1 : 1,
        }
      },

      _masonryGroupsSearchBrickSpaceByRow: function(options) {
        var placed = false;
        for (var row = options.startRow; row <= options.maxRow; row++) {
          var col = options.iteration.start;
          while (options.iteration.conditionCallback(col)) {
            placed = placed || this._masonryGroupsAttemptToPlaceBrick(col, row, options);
            col = col + options.iteration.increment;
          }
        };
        return placed;
      },

      _masonryGroupsSearchBrickSpaceByColumn: function(options) {
        var placed = false,
            col = options.iteration.start;
        while (options.iteration.conditionCallback(col)) {
          for (var row = options.startRow; row <= options.maxRow; row++) {
            placed = placed || this._masonryGroupsAttemptToPlaceBrick(col, row, options);
          }
          col = col + options.iteration.increment;
        };
        return placed;
      },

      _masonryGroupsAttemptToPlaceBrick: function(col, row, options) {
        var fits = this._masonryGroupsFitsBrick(col, row, options.colSpan, options.rowSpan);
        if (fits) {
          this._masonryGroupsPlaceBrick(options.brick, col, row, options.colSpan, options.rowSpan);
          while (this._masonryGroupsStartRowFull(options.startRow)) {
            options.startRow++;
          }
        }
        return fits;
      },

      _masonryGroupsGetMapValue: function(col, row) {
        if (typeof this.masonryGroups.displayMap[col] == 'undefined') {
          return 0;
        }

        return this.masonryGroups.displayMap[col][row] || 0;
      }

  });
})(jQuery)
