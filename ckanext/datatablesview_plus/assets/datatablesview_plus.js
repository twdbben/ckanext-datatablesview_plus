var table_rows_per_page = 100;

var run_query = function (params, format) {

  var form = $('#filtered-datatables-download');

  /* remove hidden inputs if they exist */
  form.find('input[name="params"]').remove();
  form.find('input[name="format"]').remove();

  /* add current version of hidden inputs */
  var p = $('<input name="params" type="hidden"/>');
  p.attr("value", JSON.stringify(params));
  form.append(p);
  var f = $('<input name="format" type="hidden"/>');
  f.attr("value", format);
  form.append(f);
  form.submit();

}

this.ckan.module('datatablesview_plus', function (jQuery) {
  return {
    initialize: function () {

      // Initialize datatable. To set options on DataTable, use data- attribute 
      // tags in templates/datatables/datatables_view.html
      var datatable = jQuery('#dtprv').DataTable({

        // Setup search highlighting
        mark: true,

        // define default column order
        order: [[0, 'asc']],

        // Setup searchBuilder
        searchBuilder: {
          depthLimit: 2
        },

        // Set column reordering
        colReorder: false,

        // Set language strings
        language: {
          lengthMenu: "_MENU_ rows per page",
          paginate: {
            first: '<i class="fa fa-angle-double-left" aria-hidden="true"></i>',
            previous: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
            next: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
            last: '<i class="fa fa-angle-double-right" aria-hidden="true"></i>'
          },
          search: '',
          searchPlaceholder: 'Search...',
          searchBuilder: {
            title: '',
            add: '<i class="fa fa-plus" aria-hidden="true"></i> Add Filter',
            clearAll: '<i class="fa fa-times" aria-hidden="true"></i> CLEAR ALL',
            delete: '<i class="fa fa-times" aria-hidden="true"></i>',
            right: '<i class="fa fa-chevron-right" aria-hidden="true"></i>',
            left: '<i class="fa fa-chevron-left" aria-hidden="true"></i>',
            data: 'Field'

          }
        },

        // turn on state saving
        stateSave: true,

        lengthMenu: [
          [10, 100, 1000],
          ['10', '100', '1,000']
        ],

        deferRender: true,

        // turn on scroller
        paging: false,
        scrollX: true,
        scrollY: "60vh",
        scrollCollapse: true,

        columnDefs: [
          {
            width: '20px',
            targets: 0
          },
          {
            targets: '_all',
            render: DataTable.render.text()
          }
        ],

        buttons: [
          /*
          Temporarily turning download buttons off
          
          {
            extend: 'csvHtml5',
            text: 'CSV <i class="fa fa-download" aria-hidden="true"></i>',
            fieldSeparator: ',',
            filename: $('#dtprv').attr('data-filename'),
            extension: '.csv',
            exportOptions: {
              format: {
                header: function (data, columnIdx) {
                  return get_export_header(columnIdx);
                }
              },
              columns: [function (idx, data, node) {
                return idx === 0 ?
                  false : true;
              }
              ]
            }
          },
          {
            extend: 'csvHtml5',
            text: 'TSV <i class="fa fa-download" aria-hidden="true"></i>',
            fieldSeparator: '\t',
            filename: $('#dtprv').attr('data-filename'),
            extension: '.tsv',
            exportOptions: {
              format: {
                header: function (data, columnIdx) {
                  return get_export_header(columnIdx);
                }
              },
              columns: [function (idx, data, node) {
                return idx === 0 ?
                  false : true;
              }
              ]
            }
          },
          */
          {
            extend: 'copy',
            text: '<i class="fa fa-copy" aria-hidden="true"></i> COPY SELECTED',
            title: null,
            exportOptions: {
              format: {
                header: function (data, columnIdx) {
                  return get_export_header(columnIdx);
                }
              },
              columns: [function (idx, data, node) {
                return idx === 0 ?
                  false : true;
              }
              ]
            }
          },
          {
            extend: 'print',
            text: '<i class="fa fa-print" aria-hidden="true"></i> PRINT SELECTED',
            title: "",
            exportOptions: {
              format: {
                header: function (data, columnIdx) {
                  return get_export_header(columnIdx);
                }
              },
              columns: [function (idx, data, node) {
                return idx === 0 ?
                  false : true;
              }
              ]
            }
          },
        ],

        pagingType: 'full_numbers',
        "pageLength": table_rows_per_page,

        /* 
        Trying to remove the _id option from the Term filter in SearchBuilder. 
        Need to figure out how to do this generically for all columns instead 
        of having to code it column-by-column which is untenable for our needs 
        since we don't know the columns beforehand
        https://datatables.net/extensions/searchbuilder/examples/customisation/plugin.html

        init: function(that, fn, preDefined = null) {

          alert( 'hello' );
          let el = $('.dtsb-data');

          $(el).on('dtsb-inserted', function(){
            alert( 'hello' );
          });

        },

        */

        "initComplete": function (settings, json) {

          console.log('DataTables has finished its initialisation.');
          setup_select_buttons();
          // update_select_buttons();
          setup_searchbuilder_buttons();
          update_filenames();
          add_advanced_search_button();

        },

        search: {
          "smart": true,
          "regex": false,
          "return": false
        },

        // turn on table metadata display
        infoCallback: function (settings, start, end, max, total, pre) {

          var rows_per_page = $('select[name="dtprv_length"]').val();

          if (total <= rows_per_page) {

            // console.log( 'hide pagination' );
            $('.dataTables_paginate').hide();

          } else {

            // console.log( 'show pagination' );
            $('.dataTables_paginate').show();

          }

          return "Showing " + start.toLocaleString("en-US") + "-" + end.toLocaleString("en-US") + " of " + total.toLocaleString("en-US") + "  row" + (total != 1 ? 's' : '');
        },

        headerCallback: function (thead, data, start, end, display) {

          $(thead).find('th').eq(0).html('');

          // replace column header labels with those from the data dictionary if available
          var datadict = JSON.parse($('#dtprv_wrapper table').attr('data-datadictionary'));
          $(datadict).each(function (i) {
            if ('info' in datadict[i] && datadict[i].info.label != '') {

              var label = datadict[i].info.label;
              if (datadict[i].id != datadict[i].info.label) {
                label = '<div class="dtlabel">' + label + '</div>' + '<span class="small dim">' + datadict[i].id + '</span>';
              }
              $(thead).find('th').eq(i + 1).html(label);
            }

            // Stash the original term as an attribute so that we can use it when exporting data
            $(thead).find('th').eq(i + 1).attr('data-term', datadict[i].id);

          });

          // set column widths based on information in summary statistics
          var data_summary_json = $('#dtprv_wrapper table').attr('data-summary-statistics');
          if (typeof data_summary_json !== 'undefined' && data_summary_json !== false) {
            var data_summary = JSON.parse(data_summary_json);
            $(data_summary).each(function (i) {
              var column_class = '';
              if ('type' in data_summary[i] && data_summary[i].type == 'String') {
                if ('max_length' in data_summary[i]) {
                  if (data_summary[i].max_length > 1000) {
                    column_class = 'gt1000';
                  } else if (data_summary[i].max_length > 500) {
                    column_class = 'gt500';
                  } else if (data_summary[i].max_length > 100) {
                    column_class = 'gt100';
                  }
                }
                if ('field' in data_summary[i] && data_summary[i].field != '') {
                  $(thead).find('th#' + data_summary[i].field).addClass(column_class);
                }
              }
            });
          }

        },

        /* 
          stateSaveCallback and stateLoadCallback are configured here in order to allow us to have a 'share' link for table state
          Inspired by this helpful stackexchange post:
          https://stackoverflow.com/questions/55446923/datatables-1-10-using-savestate-to-remember-filtering-and-order-but-need-to-upd/60708638#60708638
        */
        stateSaveCallback: function (settings, data) {
          //encode current state to base64
          const state = btoa(JSON.stringify(data));
          //get query part of the url
          let searchParams = new URLSearchParams(window.location.search);
          //add encoded state into query part
          searchParams.set($(this).attr('id') + '_state', state);
          //form url with new query parameter
          const newRelativePathQuery = window.location.pathname + '?' + searchParams.toString() + window.location.hash;
          //push new url into history object, this will change the current url without need of reload
          history.pushState(null, '', newRelativePathQuery);
        },
        stateLoadCallback: function (settings) {
          const url = new URL(window.location.href);
          let state = url.searchParams.get($(this).attr('id') + '_state');

          //check the current url to see if we've got a state to restore
          if (!state) {
            return null;
          }

          //if we got the state, decode it and add current timestamp
          state = JSON.parse(atob(state));
          state['time'] = Date.now();

          return state;
        }

      });

      // Add a button to the search box to allow users to clear the search
      $('#dtprv_filter input[type="search"]').after('<button class="dt-search-cancel"><i class="fa fa-times-circle" aria-hidden="true"></i></button>');

      /* Update header based on whether DataTable is a preview or a full dataset */
      var dtprv_is_preview = $('#dtprv_is_preview').val();
      var dtprv_preview_rows = parseInt($('#dtprv_preview_rows').val());
      var dtprv_total_record_count = parseInt($('#dtprv_total_record_count').val());
      var dtprv_date_modified = $('#dtprv_metadata_modified').val();
      var dtprv_status = $('');

      if (dtprv_is_preview == 'True') {

        dtprv_status = $(
          '<div id="dtprv_status">' +
          '<p class="warning"><span title="" class="error-icon"></span> ' +
          'Only the first ' + dtprv_preview_rows.toLocaleString("en-US") + ' rows of this dataset are shown in the data viewer due to storage restrictions. ' +
          'Download the full dataset to access all ' + dtprv_total_record_count.toLocaleString("en-US") + ' rows.' +
          '</p>' +
          '</div>'
        );
        dtprv_status.insertBefore('#dtprv_processing');
        $('.dt-buttons').css('display', 'none');

      } else {

        // Show pointer cursor when hovering over selectable body of table
        $('#dtprv tbody').css('cursor', 'pointer');


        // var dtprv_status = $( '<div id="dtprv_status"><p class="">This data was last updated on ' + dtprv_date_modified + '.</p></div>' );
        // dtprv_status.insertBefore( '#dtprv_processing' );
      
      }

      /* Replace built in rotating ellipsis animation with TWDH preferred FontAwesome circle-o-notch animation */
      $('div.dataTables_processing').html('<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>');

      /* 
      
        Observe iframe body height and post message to parent on resize
        window.onmessage in the theme js should catch this and resize the iframe as desired
      
      */
      const resizeObserver = new ResizeObserver((entries) => {
        // console.log( 'resizeObserver' );
        // console.log( entries );
        for (const entry of entries) {
          if (entry.contentBoxSize) {
            const contentBoxSize = entry.contentBoxSize[0];
            console.log( 'resizeObserver: ' + contentBoxSize.blockSize );
            window.parent.postMessage({ frameHeight: contentBoxSize.blockSize }, '*');
          }
        }
      });
      resizeObserver.observe(document.querySelector("#dtplus_dtprv_wrapper"));

      /* select button show/hide */

      var selectTimeout;

      function update_filenames() {

        console.log();

      }

      function setup_searchbuilder_buttons() {


      }

      function setup_select_buttons() {

        $('.dt-buttons').removeClass('btn-group');
        $('.dt-buttons button').addClass('btn-tertiary');
        $('.dt-buttons button.btn-tertiary').css('display', 'none');
        $('.dt-buttons').append('<button class="btn btn-disabled"><span><i class="fa fa-ban" aria-hidden="true"></i> COPY SELECTED</span></button> ');
        $('.dt-buttons').append('<button class="btn btn-disabled"><span><i class="fa fa-ban" aria-hidden="true"></i> PRINT SELECTED</span></button> ');


      }

      /* Show/Hide selection toolbar */
      function update_select_buttons() {

        var count = datatable.rows({ selected: true }).count();

        if (count > 0) {

          if (dtprv_is_preview == 'False') {

            $('.dt-buttons button.btn-tertiary').css('display', 'inline-block');
            $('.dt-buttons button.btn-disabled').css('display', 'none');
    
          }

        } else {

          $('.dt-buttons button.btn-tertiary').css('display', 'none');
          $('.dt-buttons button.btn-disabled').css('display', 'inline-block');
  
        }

      }

      function add_advanced_search_button() {

        // Add button
        var container = $('#dtprv_wrapper').find('.advanced-search');
        container.append( '<button class="btn btn-default btn-secondary"><i class="fa fa-filter" aria-hidden="true"></i>Advanced Filters</button>' );

        // Set click even ton button
        var button = $('#dtprv_wrapper .advanced-search').find('button');
        $(button).click(function () {

          $('.dt-free-text-search').css('display', 'none');
          console.log( 'advanced search button clicked' );
        
          $( '#dtprv_wrapper .dtsb-searchBuilder > .dtsb-group > .dtsb-add' ).click();


        });

      }

      datatable.on('select', function (e, dt, type, indexes) {

        update_select_buttons();

      });

      datatable.on('deselect', function (e, dt, type, indexes) {

        /* Use this timeout sequence to avoid 'flashing' effect when deselecting/reselecting in one click */
        clearTimeout(selectTimeout);
        selectTimeout = setTimeout(() => { update_select_buttons(); }, 100);

      });


      /* Toggle button on the search box allowing users to clear the search */
      $('#dtprv_filter input[type=search]').on('input', function () {

        if ($(this).val() == '') {

          $('#dtprv_filter .dt-search-cancel').css('display', 'none');

        } else {

          $('#dtprv_filter .dt-search-cancel').css('display', 'block');

        }

      });

      /* React to click of search clear button */
      $('#dtprv_filter .dt-search-cancel').click(function () {

        datatable.search('').draw();
        $('#dtprv_filter .dt-search-cancel').css('display', 'none');

      });

      /* Get column header with 'true' label for export files */
      function get_export_header(i) {

        return $('#dtprv thead').find('th').eq(i).attr('data-term');

      }

      /*
      const observer = new MutationObserver(function(mutations_list) {
        mutations_list.forEach(function(mutation) {
          console.log( 'removed nodes' );
          mutation.removedNodes.forEach(function(removed_node) {
            if( $( removed_node ).hasClass( 'dtsb-clearAll' ) ) {

              console.log(removed_node);
              $('#dtprv_filter').css( 'display', 'block' );
              // observer.disconnect();
            }
          });
        });
      });
      
      observer.observe(document.querySelector("#dtprv_wrapper"), { subtree: true, childList: true });
      */


      /* Set up a callback function when an element is inserted into the dom */
      function onElementInserted(containerSelector, elementSelector, callback) {
        /*
          containerSelector: element under which to watch for a new element
          elementSelector:   the element to watch for
          callback:         the function to call when elementSelector is found
        */

        var onMutationsObserved = function (mutations) {
          mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length) {
              var elements = $(containerSelector).find(elementSelector);
              for (var i = 0, len = elements.length; i < len; i++) {
                callback(elements[i]);
              }
            }
          });
        };

        var target = $(containerSelector)[0];
        var config = { attributes: true, characterData: true, childList: true, subtree: true };
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        var observer = new MutationObserver(onMutationsObserved);
        observer.observe(target, config);

      }


      /* Add click callback to handle when the clear all button is clicked in Search Builder */
      onElementInserted('.dtsb-searchBuilder', '.dtsb-clearAll', function (element) {
        $(element).click(function () {
          $('.dt-free-text-search').css('display', 'block');
          $('#dtprv_wrapper .dtsb-searchBuilder').css('display', 'none');
        });
        $( element ).addClass( 'btn btn-secondary' );
      });

      /* Add click callback to handle when the Search Builder is activated */
      onElementInserted('.dtsb-searchBuilder', '.dtsb-add', function (element) {
        $(element).click(function () {
          $('.dt-free-text-search').css('display', 'none');
          $('#dtprv_wrapper .dtsb-searchBuilder').css('display', 'block');
        });
        $( element ).addClass( 'btn btn-secondary' );

        // $( '.dtsb-add' ).html( '<i class="fa fa-times" aria-hidden="true"></i> ADD FILTER' );

        // $( element ).prepend( 'hello world' );

        /*
        var criteria = $('.dtsb-searchBuilder').find('.dtsb-criteria');
        console.log( 'criteria' );
        for (var i = 0, len = criteria.length; i < len-1; i++) {
          console.log( $( criteria[i] ).find( '.dtsb-value').val() );
          // console.log( $( criteria[i] ).find( '.dtsb-value').val() );
          if( $( criteria[i] ).val().length == 0 ) {
            // console.log( 'WARNING')
            $( criteria[i] ).addClass( 'warning' );
          } else {
            $( criteria[i] ).removeClass( 'warning' );
          }
        };
        */
      });

      /* Add input callback to monitor criteria settings and add/remove warning class for empty criteria */
      onElementInserted('.dtsb-searchBuilder', '.dtsb-value', function (element) {
        // console.log(element);
        $(element).on('input', function () {
          console.log('.dtsb-value edited');
          /*
          if ($(element).val().length > 0) {
            $(element).parent().parent().removeClass('warning');
          } else {
            $(element).parent().parent().addClass('warning');
          }
          */
        });
      });

      /* Add click callback to display free text search input when 
         Search Builder is deactivated by removing the last filter 
         criteria 
      */
      onElementInserted('.dtsb-searchBuilder', '.dtsb-delete', function (element) {
        $(element).click(function () {
          var conditions = $('.dtsb-searchBuilder').find('.dtsb-delete');
          if (conditions.length == 0) {
            $('.dt-free-text-search').css('display', 'block');
            $('#dtprv_wrapper .dtsb-searchBuilder').css('display', 'none');
          }
        });
      });

      /* Add callback to display free text search input when
         Search Builder is deactivated by removing the last filter group
      */         
      onElementInserted('.dtsb-searchBuilder', '.dtsb-clearGroup', function (element) {
        $(element).click(function () {
          var conditions = $('.dtsb-searchBuilder').find('.dtsb-clearGroup');
          if (conditions.length == 0) {
            $('.dt-free-text-search').css('display', 'block');
            $('#dtprv_wrapper .dtsb-searchBuilder').css('display', 'none');
          }
        });
      });

    }

  }
  
});