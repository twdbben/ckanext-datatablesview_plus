this.ckan.module('resource-view-sharesearch', function ($) {
  var modal;
  var self;

  var state;
  console.log( 'sharesearch' );

  alert( 'hello' );
  function initialize() {

    self = this;
    modal = window.parent.$('#sharesearch-'+this.options.id);
    console.log( modal );
    this.el.on('click', _onClick);
    $('input', modal).on('focus', _selectAllCode).on('mouseup', _preventClick);
    $('input', modal).attr('readonly', true);

  }

  function _onClick (event) {
    event.preventDefault();
    _updateValues();
    modal.modal('show');
  }

  function _selectAllCode () {
    $('input', modal).select();
  }

  function _updateValues () {
    _updateShareSearchURL();
  }

  function _updateShareSearchURL () {

    var sharesearch = {};
    var details = _getState(true);

    var orig = $("#resource-viewer").contents().find("#dtprv_search_orig").val();
    var current = $("#resource-viewer").contents().find("#dtprv_search_current").val();

    if( orig != '' && orig == current ) {

      // loaded ShareSearch has not been modified, so we can keep the same UUID
      let params = new URLSearchParams(document.location.search);
      sharesearch.uuid = params.get( 'search' );

    } else {

      // ShareSearch was not loaded or has been modified, so we need a new UUID 
      var dataset_id = _getDatasetId(true);
      sharesearch = _setShareSearchUUID( details, dataset_id );

    }

    if( details.search['search'] != '' ) {

      $('.sharesearch-details', modal).html('Search: ' + details.search['search'] );

    } else if( details.searchBuilder ) {

      $('.sharesearch-details', modal).html('Advanced Search: <br/><ul>' + _searchbuilderCriteriaDisplay( details.searchBuilder ) + '</ul>');

    }
        
    //form url with new query parameter
    const newURL = window.location.origin + window.location.pathname + '?search=' + sharesearch['uuid'];

    $('[name="ss-url"]', modal).val(newURL);
    $('#sharesearch-copy', modal).attr( 'data-url', newURL);

  }

  function _searchbuilderCriteriaDisplay( state ) {

    if( state.criteria !== undefined  ) {

      return _criteriaDisplay( state.criteria, state.logic );
    
    }

  }

  function _criteriaDisplay( criteria, logic ) {

    var html = '';

    // console.log( criteria );
    // console.log( logic );

    for(var c = 0; c < criteria.length; c++) {
      
      if( criteria[c].criteria !== undefined  ) {

        html = html + _criteriaDisplay( criteria[c].criteria, criteria[c].logic );

      } else {

        html = html + '<li>' + criteria[c]['data'] + ' ' + _lookupCondition( criteria[c]['condition'], criteria[c]['type'] ) + ' ' + criteria[c]['value'][0] + '</li>';

      }

      if( c+1 != criteria.length ) {
        html = html + '<li>' + logic + '</li>';
      }
    
    }

    return '<ul>' + html + '</ul>';

  }

  function _lookupCondition (condition, type) {

    var language = {

      'num': {

        '=': 'Equals',
        '!=': 'Not',
        '<': 'Less Than',
        '<=': 'Less Than Equal To',
        '>=': 'Greater Than Equal To',
        '>': 'Greater Than',
        'between': 'Between',
        '!between': 'Not Between',
        'null': 'Empty',
        '!null': 'Not Empty',

      },
      'date': {
      
        '=': 'Equals',
        '!=': 'Not',
        '<': 'Before',
        '>': 'After',
        'between': 'Between',
        '!between': 'Not Between',
        'null': 'Empty',
        '!null': 'Not Empty'

      },
      'string': {

        '=': 'Equals',
        '!=': 'Not',
        'starts': 'Starts With',
        '!starts': 'Does Not Start With',
        'contains': 'Contains',
        '!contains': 'Does Not Contain',
        'ends': 'Ends With',
        '!ends': 'Does Not End With',
        'null': 'Empty',
        '!null': 'Not Empty'
      },
      'html': {

        '=': 'Equals',
        '!=': 'Not',
        'starts': 'Starts With',
        '!starts': 'Does Not Start With',
        'contains': 'Contains',
        '!contains': 'Does Not Contain',
        'ends': 'Ends With',
        '!ends': 'Does Not End With',
        'null': 'Empty',
        '!null': 'Not Empty'
      }


    }

    // console.log( condition + ' ' + type );

    return language[type][condition];

  }

  function _preventClick (event) {
    event.preventDefault();
  }

  function _getState (decoded=false) {
    var state = $("#resource-viewer").contents().find("#dtprv_state").val();  
    if( decoded && state != '' ) {
      state = JSON.parse(atob(state));
    }
    return state;
  }

  function _getDatasetId () {
    var id = $("input[name='dataset-id']").val();  
    return id;
  }

  function _setShareSearchUUID( data, dataset_id ) {

    const searchstate = btoa(JSON.stringify(data));

    var query = 'searchstate=' + searchstate + '&dataset_id=' + dataset_id;

    var response = $.ajax({

      type:'POST',
      url: '/datatables/sharesearch/',
      data: query,
      cache: false,
      async: false,

      success: function(response, status, xhr) {

      },

      error: function (xhr, ajaxOptions, thrownError) {

        console.log( 'AJAX sharesearch creation error' );
        console.log( thrownError );

      },

    });

    return response.responseJSON;

  }

  return {
    initialize: initialize,
    options: {
      id: 0,
      url: '#',
      width: 700,
      height: 400
    }
  }
});
