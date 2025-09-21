
/*
 * Version: 3.7
 */
jQuery(document).ready( function($) {
    
    /*
      * PDFs Dropdown
      */
    $(".bsk-pdfm-output-container").on("change", ".bsk-pdfm-pdfs-dropdown", function( e ){
        
        var output_container = $(this).parents(".bsk-pdfm-output-container");
        
        var url = $(this).val();
        
        if( url && output_container.find(".bsk-pdfm-statistics-ajax-nonce").length &&
            output_container.find( ".bsk_pdfm_settings_enalbe_permalink_cls" ).val() < 1 ){
            
            //do not do statics by ajax if permalink enabled
            
            var ajax_nonce = output_container.find(".bsk-pdfm-statistics-ajax-nonce").val();
            var pdf_id = $(this).find(":selected").attr("id");
            if( pdf_id == "" ){
                //console.log( 'Invalid PDF id' );
                return;
            }
            var pdf_id_array = pdf_id.split('-');
            var pdf_id_int = parseInt( pdf_id_array[pdf_id_array.length - 1] );
            if( pdf_id_int < 1 ){
                //console.log( 'Invalid PDF id' );
                return;
            }
            var action_val = 'pdfs_statistics_update_download_count';
            var data = { action: action_val, id: pdf_id_int, nonce: ajax_nonce };

            $.post( bsk_pdf_pro.ajaxurl, data, function(response) {
                //do nothing
            });

        }

		if( url ){
			//window.open( url, target);
            var form_ID_random = $( this ).data( "from-id" );
            if ( $( "#bsk_pdfm_compatible_405_ID_" + form_ID_random ).length > 0 ) {
                if ( $( "#bsk_pdfm_compatible_405_ID_" + form_ID_random ).val() == 'yes' || 
                     $( "#bsk_pdfm_compatible_405_ID_" + form_ID_random ).val() == 'YES' ) {
                    
                    $( "#bsk_pdfm_pdfs_dropdown_to_open_ID_" + form_ID_random ).val( url );
                    $( "#bsk_pdfm_pdfs_dropdown_open_form_ID_" + form_ID_random ).submit();
                    return;
                }
            }

            $( "#bsk_pdfm_pdfs_dropdown_open_form_ID_" + form_ID_random ).prop( "action", url );
            $( "#bsk_pdfm_pdfs_dropdown_open_form_ID_" + form_ID_random ).submit();
		}
    });
    
     /*
      * Search bar
      */
    $(".bsk-pdfm-output-container, .bsk-pdfm-widget-output-container").on("keypress", ".bsk-pdfm-search-keywords", function( e ){
        if( e.which == 13 ) {
            $(this).parent().find(".bsk-pdfm-search-anchor").click();
        }
    });
    
     /*
      * Category password
      */
    //can only be numbers & letters
    $(".bsk-pdfm-output-container").on("keyup", ".bsk-pdfm-category-password", function( e ){
        //only number & letters
        this.value = this.value.replace(/[^0-9a-zA-Z]/g, '');
    });
    
    $(".bsk-pdfm-output-container").on("keypress", ".bsk-pdfm-category-password", function( e ){
        if( e.which == 13 ) {
            $(this).parent().find(".bsk-pdfm-category-password-verify-anchor").click();
        }
    });
    
    /*
     * PDFs ajax query
     * Pagination, Search
     * Category Password
     */
    $(".bsk-pdfm-output-container").on("click", ".bsk-pdfm-pagination a, .bsk-pdfm-search-input button, .bsk-pdfm-search-results a, .bsk-pdfm-category-password-verify-anchor, .bsk-pdfm-title-filter-anchor, .bsk-pdfm-extension-filter-anchor, .bsk-pdfm-tags-filter-anchor", { infinite_scrolling: false }, ajax_query_pdfs_function );
    
    $(".bsk-pdfm-output-container").on("change", ".bsk-pdfm-date-weekday-query-year, .bsk-pdfm-date-weekday-query-month, .bsk-pdfm-date-weekday-query-day, .bsk-pdfm-date-weekday-query-weekday", { infinite_scrolling: false }, ajax_query_pdfs_function );
    
    function ajax_query_pdfs_function( event ){

        /* console.log( event );
        console.log( event.infinite_scrolling ); */

        var called_by_infinite_scrolling = false;
        var output_container = '';
        if ( event.infinite_scrolling != undefined && event.infinite_scrolling ) {
            output_container = event.scrolling_container;
            called_by_infinite_scrolling = true;
        } else if ( event.data.infinite_scrolling == false ) {
            output_container = $(this).parents(".bsk-pdfm-output-container");
            called_by_infinite_scrolling = false;
        } else {
            console.log( 'Confused in ajax_query_pdfs_function');
            return;
        }

        var shortcode_type = '';
        var output = '';
        if( output_container.hasClass("shortcode-pdfs") ){
            shortcode_type = 'pdfs';
        }else if( output_container.hasClass("shortcode-category") ){
            shortcode_type = 'category';
        }else if( output_container.hasClass("shortcode-selector") ){
            shortcode_type = 'selector';
        }else{
            return;
        }

        if( output_container.hasClass( 'layout-ul' ) ){
            output =  'ul';
        }else if( output_container.hasClass( 'layout-ol' ) ){
            output = 'ol';
        }else if( output_container.hasClass( 'layout-columns' ) ){
            output = 'columns';
        }else if( output_container.hasClass( 'layout-dropdown' ) ){
            output = 'dropdown';
        }else{
            return;
        }

        //clear error message
        output_container.find(".bsk-pdfm-error-message").remove();
        
        var keywords_val = '';
        var keywords_match_type_choice = 'PARTIALLY';
        var search_cat_id_val = '';
        var search_year_of_val = '';
        var extension_filter_val = '';
        var start_with = '';
        var date_weekday_query_year = '';
        var date_weekday_query_month = '';
        var date_weekday_query_day = '';
        var date_weekday_query_weekday = '';
        var tags_filter_val = '';
        
        /*
         * for extension filter
         */
        if ( called_by_infinite_scrolling == false && $(this).hasClass( "bsk-pdfm-extension-filter-anchor" ) ) {
            if( $(this).hasClass("active") ){
                return;
            }
            extension_filter_val = $(this).data("extension");
            $(this).addClass( "bsk-pdfm-just-clicked" );
            output_container.find(".bsk-pdfm-extension-filter-ajax-loader").css("display", "block");
            
            //refresh pagination
            output_container.find(".bsk-pdfm-pagination").find("li").removeClass("active");
        } else if ( output_container.find( ".bsk-pdfm-extension-filter-anchor.active" ).length > 0 ) {
            extension_filter_val = output_container.find( ".bsk-pdfm-extension-filter-anchor.active" ).data("extension");
        }
        
        /*
         * for title filter
         */
        if ( called_by_infinite_scrolling == false &&  $(this).hasClass( "bsk-pdfm-title-filter-anchor" ) ) {
            if( $(this).hasClass("active") ){
                return;
            }
            start_with = $(this).data("start-with");
            $(this).addClass( "bsk-pdfm-just-clicked" );
            output_container.find(".bsk-pdfm-title-filter-ajax-loader").css("display", "block");
            
            //refresh pagination
            output_container.find(".bsk-pdfm-pagination").find("li").removeClass("active");
        } else if ( output_container.find( ".bsk-pdfm-title-filter-anchor.active" ).length > 0 ) {
            start_with = output_container.find( ".bsk-pdfm-title-filter-anchor.active" ).data("start-with");
        }
        
        /*
         * for date weekday query filter
         */
        if ( output_container.find( ".bsk-pdfm-date-weekday-query-filter" ).length > 0 ) {
            
            if( output_container.find( ".bsk-pdfm-date-weekday-query-year" ).length > 0 ){
                date_weekday_query_year = output_container.find( ".bsk-pdfm-date-weekday-query-year" ).val();
            }
            
            if( output_container.find( ".bsk-pdfm-date-weekday-query-month" ).length > 0 ){
                date_weekday_query_month = output_container.find( ".bsk-pdfm-date-weekday-query-month" ).val();
            }
            
            if( output_container.find( ".bsk-pdfm-date-weekday-query-day" ).length > 0 ){
                date_weekday_query_day = output_container.find( ".bsk-pdfm-date-weekday-query-day" ).val();
            }
            
            if( output_container.find( ".bsk-pdfm-date-weekday-query-weekday" ).length > 0 ){
                date_weekday_query_weekday = output_container.find( ".bsk-pdfm-date-weekday-query-weekday" ).val();
            }
            
            if ( called_by_infinite_scrolling == false ) {
                if( $(this).hasClass("bsk-pdfm-date-weekday-query-year") || 
                    $(this).hasClass("bsk-pdfm-date-weekday-query-month") || 
                    $(this).hasClass("bsk-pdfm-date-weekday-query-day") || 
                    $(this).hasClass("bsk-pdfm-date-weekday-query-weekday") ){
                    
                    var date_weekday_query_filter_container = output_container.find(".bsk-pdfm-date-weekday-query-filter");
                    date_weekday_query_filter_container.find(".bsk-pdfm-date-weekday-query-filter-ajax-loader").css( "display", "inline-block" );
                }
            }
        }
        
        /*
         * for tags filter
         */
        if ( called_by_infinite_scrolling == false && $(this).hasClass( "bsk-pdfm-tags-filter-anchor" ) ) {
            if( $(this).hasClass("active") ){
                return;
            }
            tags_filter_val = $(this).data("tagid");
            $(this).addClass( "bsk-pdfm-just-clicked" );
            output_container.find(".bsk-pdfm-tags-filter-ajax-loader").css("display", "block");
            
            //refresh pagination
            output_container.find(".bsk-pdfm-pagination").find("li").removeClass("active");
        } else if ( output_container.find( ".bsk-pdfm-tags-filter-anchor.active" ).length > 0 ) {
            tags_filter_val = output_container.find( ".bsk-pdfm-tags-filter-anchor.active" ).data("tagid");
        }

        /*
          for search bar 
          */
        if ( called_by_infinite_scrolling == false && ( $(this).hasClass("bsk-pdfm-search-anchor") || $(this).hasClass("bsk-pdfm-search-clear-anchor") ) ) {
            var search_input_obj = $(this).parents(".bsk-pdfm-search-bar").find(".bsk-pdfm-search-input");
            
            if( $(this).hasClass("bsk-pdfm-search-clear-anchor") ){
                search_input_obj.find(".bsk-pdfm-search-keywords").val( "" );
                search_input_obj.find(".bsk-pdfm-year-dropdown").val( "" );
                search_input_obj.find(".bsk-pdfm-category-dropdown").val( "" );
            }
            
            var search_reulsts_label_obj = $(this).parents(".bsk-pdfm-search-bar").find(".bsk-pdfm-search-results");
            search_reulsts_label_obj.css("display", "block");
            search_reulsts_label_obj.find(".bsk-pdfm-searchbar-ajax-loader").css( "display", "inline-block" );
            search_reulsts_label_obj.find(".bsk-pdfm-search-results-desc").css( "display", "none" );
            
            //refresh pagination
            output_container.find(".bsk-pdfm-pagination").find("li").removeClass("active");
        }
        if( output_container.find( ".bsk-pdfm-search-bar" ).length > 0 ){
            var search_input_obj = output_container.find(".bsk-pdfm-search-input");
            keywords_val = search_input_obj.find(".bsk-pdfm-search-keywords").val();
            keywords_val = $.trim( keywords_val );
            keywords_input_placeholder = search_input_obj.find(".bsk-pdfm-search-keywords").attr("placeholder");
            if( keywords_val == keywords_input_placeholder ){
                keywords_val = '';
            }
            keywords_match_type_choice = $( "input[name='bsk_pdfm_search_keywords_match_choice']:checked" ).val();
            if( search_input_obj.find(".bsk-pdfm-year-dropdown").length ){
                search_year_of_val = search_input_obj.find(".bsk-pdfm-year-dropdown").val();
            }
            if( search_input_obj.find(".bsk-pdfm-category-dropdown").length ){
                search_cat_id_val = search_input_obj.find(".bsk-pdfm-category-dropdown").val();
            }
        }
        
        /* 
          * for pagination
          */
        var page_to_show = 1;
        if ( called_by_infinite_scrolling == false && $(this).hasClass( "bsk-pdfm-pagination-anchor" ) ) { //pagination anchor
            if( $(this).parent().hasClass("active") ){
                //click on active pagination anchor
                return;
            }
            page_to_show = $(this).data("page");
            output_container.find(".bsk-pdfm-pagination-ajax-loader").css( "display", "inline-block" );
        } else if ( output_container.find(".bsk-pdfm-pagination").length ) {
            if( output_container.find(".bsk-pdfm-pagination").find("li.active").length ){
                page_to_show = output_container.find(".bsk-pdfm-pagination").find("li.active").find("a").data("page");
            }
        } else if ( called_by_infinite_scrolling ) {
            //{ infinite_scrolling: true, scrolling_container: scrolling_container_obj, header : header_obj,  current: current_page, max: max_page }
            page_to_show = event.current;
        }
        
        
         /* 
          * for verify password
          */
        var category_password_str = '';
        if ( called_by_infinite_scrolling == false && $(this).hasClass( "bsk-pdfm-category-password-verify-anchor" ) ) { //verify password anchor
            var password = $(this).parent().find(".bsk-pdfm-category-password").val();
            password = $.trim( password );
            if( password == "" ){
                $(this).parent().find(".bsk-pdfm-category-password").val( "" );
                $(this).parent().find(".bsk-pdfm-category-password").focus();
                return;
            }
            var category_id = $(this).parents(".bsk-pdfm-category-password-form").data( "cat-id" );
            var exist_password = output_container.find(".category-password-hidden-feild").val();
            var exist_password_array = new Array();
            var password_updated = false;
            if( exist_password ){
                exist_password_array = exist_password.split(',');
                for( var i_password = 0; i_password < exist_password_array.length; i_password++){
                    var category_n_password = exist_password_array[i_password];
                    if( category_n_password.indexOf(category_id+':') != -1 ){
                        exist_password_array[i_password] = category_id + ':' + password;
                        password_updated = true;
                    }
                }
            }
            if( password_updated == false ){
                exist_password_array.push( category_id + ':' + password );
            }

            category_password_str = exist_password_array.join(',');
            output_container.find(".category-password-hidden-feild").val( category_password_str );
            $(this).parent().find(".bsk-pdfm-category-password-verify-ajax-loader").css("display", "inline-block")
        } else if ( output_container.find(".category-password-hidden-feild").length ) {
            
            category_password_str = output_container.find(".category-password-hidden-feild").val();
        }

        var ajax_nonce = output_container.find(".bsk-pdfm-" + shortcode_type + "-ajax-nonce").val();
        var action_val = "pdfs_get_" + shortcode_type + "_" + output;
        var data = { action: action_val, layout: output, nonce: ajax_nonce };
        
        //organise ajax parameters
        output_container.find(".bsk-pdfm-shortcode-attr").each(function(index, value ){
            var attr_name = $(this).data("attr_name");
            data[attr_name] = $(this).val();
        });
        
        //date weekday query filter
        //will overwrite shortcode attributes 
        if( date_weekday_query_year ){
           data['year_of'] = date_weekday_query_year;
        }
        
        if( date_weekday_query_month ){
           data['month_of'] = date_weekday_query_month;
        }
        
        if( date_weekday_query_day ){
           data['day_of'] = date_weekday_query_day;
        }
        
        if( date_weekday_query_weekday ){
           data['weekday_of'] = date_weekday_query_weekday;
        }
        
        //sear bar 
        if( search_cat_id_val ){
            data['search_cat_id'] = search_cat_id_val;
            //means under search mode
            //in this mode only search PDFs from the selected category so close hierarchical temporarily
            data['hierarchical'] = 'no';
        }
        
        if( search_year_of_val ){
            data['year_of'] = search_year_of_val;
        }
        if( extension_filter_val ){
            data['extension'] = extension_filter_val; 
        }
        if( tags_filter_val ){
            data['tags_default'] = tags_filter_val;
        }
        data['title_start_with'] = start_with;
        data['paged'] = page_to_show;
        data['keywords'] = keywords_val;
        data['keywords_match_type_choice'] = keywords_match_type_choice;
        data['password'] = category_password_str;
        data['infinite_scrolling_callback'] = called_by_infinite_scrolling ? 'infinite_scrolling' : 'ajax';
        
        /*
          * for category selector
          */
        if( shortcode_type == 'selector' ){
            data['action'] = "pdfs_get_category_" + output;
            data['nonce'] = output_container.find(".bsk-pdfm-category-ajax-nonce").val();
            data['id'] = output_container.find(".bsk-pdfm-category-selector-container").find(".bsk-pdfm-category-dropdown").val();
            //unser selector mode for showing PDF results, hierarchical is always closed
            data['hierarchical'] = 'no';
            
            if( output == 'dropdown' ){
                data['option_group_label'] = 'HIDE';
            }
            
        }
        
        /* infinite_scrolling ajax loader */
        if ( called_by_infinite_scrolling == true ) {
            var ajax_loader = event.header.find( ".bsk_pdfm_infinite_scrolling_header_ajax_loader" ).html();
            var ajax_loader_p = '<p class="bsk_pdfm_infinitive_scrolling_ajax_loader">' + ajax_loader + 'LOADING</p>';

            var pdfs_list_container = output_container.find( ".bsk-pdfm-pdfs-" + output + "-list" );
            pdfs_list_container.append( ajax_loader_p );
        }
        
        //console.log( data );

        $.post( bsk_pdf_pro.ajaxurl, data, function(response) {

            /* console.log( response );
            return; */
            
            /* infinite_scrolling ajax loader */
            if ( called_by_infinite_scrolling == true ) {
                output_container.find( ".bsk_pdfm_infinitive_scrolling_ajax_loader" ).remove();
            }
            
            var return_data = $.parseJSON( response );
            
            /*
             * process extension filter
             */
            if( output_container.find(".bsk-pdfm-extension-filter-container").length ){
                
                var extension_filter_container = output_container.find(".bsk-pdfm-extension-filter-container");
                extension_filter_container.find(".bsk-pdfm-extension-filter-ajax-loader").css("display", "none");
                
                if( extension_filter_container.find(".bsk-pdfm-just-clicked").length ){
                    
                    extension_filter_container.find( ".bsk-pdfm-extension-filter-anchor" ).removeClass( 'active' );
                    extension_filter_container.find( ".bsk-pdfm-just-clicked" ).addClass( 'active' );
                    extension_filter_container.find( ".bsk-pdfm-extension-filter-anchor" ).removeClass( 'bsk-pdfm-just-clicked' );
                }
            }
            
            /*
             * process title filter
             */
            if( output_container.find(".bsk-pdfm-title-filter-container").length ){
                
                var title_filter_container = output_container.find(".bsk-pdfm-title-filter-container");
                title_filter_container.find(".bsk-pdfm-title-filter-ajax-loader").css("display", "none");
                
                if( title_filter_container.find(".bsk-pdfm-just-clicked").length ){
                    
                    title_filter_container.find( ".bsk-pdfm-title-filter-anchor" ).removeClass( 'active' );
                    title_filter_container.find( ".bsk-pdfm-just-clicked" ).addClass( 'active' );
                    title_filter_container.find( ".bsk-pdfm-title-filter-anchor" ).removeClass( 'bsk-pdfm-just-clicked' );
                }
            }
            
            /*
             * process date weekday query filter
             */
            if( output_container.find(".bsk-pdfm-date-weekday-query-filter").length ){
                var date_weekday_query_filter_container = output_container.find(".bsk-pdfm-date-weekday-query-filter");
                date_weekday_query_filter_container.find(".bsk-pdfm-date-weekday-query-filter-ajax-loader").css( "display", "none" );
            }
            
            /*
             * process tags filter
             */
            if( output_container.find(".bsk-pdfm-tags-filter-container").length ){
                
                var tags_filter_container = output_container.find(".bsk-pdfm-tags-filter-container");
                tags_filter_container.find(".bsk-pdfm-tags-filter-ajax-loader").css("display", "none");
                
                if( tags_filter_container.find(".bsk-pdfm-just-clicked").length ){
                    
                    tags_filter_container.find( ".bsk-pdfm-tags-filter-anchor" ).removeClass( 'active' );
                    tags_filter_container.find( ".bsk-pdfm-just-clicked" ).addClass( 'active' );
                    tags_filter_container.find( ".bsk-pdfm-tags-filter-anchor" ).removeClass( 'bsk-pdfm-just-clicked' );
                }
            }
            
            /*
              * process search bar
            */
            if( output_container.find(".bsk-pdfm-search-results").length ){
                
                var search_reulsts_container = output_container.find(".bsk-pdfm-search-results");
                
                search_reulsts_container.find(".bsk-pdfm-searchbar-ajax-loader").css("display", "none");
                if( keywords_val == "" && search_year_of_val == "" && search_cat_id_val == "" ){
                    search_reulsts_container.css("display", "none");
                }else{
                    search_reulsts_container.css("display", "block");
                    search_reulsts_container.find(".bsk-pdfm-search-clear-anchor").css("display", "inline-block");
                }
                
            }
            

            /*
             * output for pdfs
             */
            if( shortcode_type == 'pdfs' ){
                output_container.find(".bsk-pdfm-date-filter").remove();
                output_container.find(".bsk-pdfm-pagination").remove();
                
                if( output == 'dropdown' ){
                    var dropdown_obj = output_container.find( ".bsk-pdfm-pdfs-dropdown" );
                    dropdown_obj.html( return_data.pdfs );
                    dropdown_obj.css( "display", "block" );
                    output_container.find(".bsk-pdfm-date-filter").remove();
                    
                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( dropdown_obj );
                    }else{
                        $( return_data.date_filter ).insertBefore( dropdown_obj );
                        //desc
                        if( output_container.find(".bsk-pdfm-count-desc-container").length ){
                            output_container.find(".bsk-pdfm-count-desc-container").find( "h3" ).html( return_data.results_desc );
                        }
                    }
                    output_container.find(".bsk-pdfm-pdfs-dropdown").focus();
                }else if( output == 'ul' || output == 'ol' ){
                    var pdfs_list_container = output_container.find(".bsk-pdfm-pdfs-" + output + "-list");
                    if ( called_by_infinite_scrolling == false ) {
                        pdfs_list_container.html( "" );
                    }
                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( pdfs_list_container );
                    }else{
                        if ( called_by_infinite_scrolling == false ) {
                            pdfs_list_container.html( return_data.pdfs );
                            //Need to refresh infinite scrolling header...
                            //console.log( 'Need to refresh infinite scrolling header...' );
                            output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_current_page" ).val( 1 );
                            output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_page_max" ).val( return_data.page_max );
                            output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_total" ).val( return_data.pdfs_count );
                        } else {
                            pdfs_list_container.append( return_data.pdfs );
                            //change status control for infinite_scrolling
                            //{ infinite_scrolling: true, scrolling_container: scrolling_container_obj, header : header_obj,  current: current_page, max: max_page }
                            event.header.find( ".bsk_pdfm_infinite_scrolling_header_current_page" ).val( page_to_show );
                            event.header.find( ".bsk_pdfm_infinite_scrolling_header_loading" ).val( 0 );
                        }
                        $( return_data.date_filter ).insertBefore( pdfs_list_container );
                        $( return_data.pagination ).insertAfter( pdfs_list_container );
                        
                        //desc
                        if( output_container.find(".bsk-pdfm-count-desc-container").length ){
                            output_container.find(".bsk-pdfm-count-desc-container").find( "h3" ).html( return_data.results_desc );
                        }
                    }                    
                }else if( output == 'columns' ){
                    var pdfs_columns_container = output_container.find(".bsk-pdfm-pdfs-columns-list");
                    if ( called_by_infinite_scrolling == false ) {
                        pdfs_columns_container.html( "" );
                    }
                    
                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( pdfs_columns_container );
                    }else{
                        if ( called_by_infinite_scrolling == false ) {
                            pdfs_columns_container.html( return_data.pdfs );
                            //Need to refresh infinite scrolling header...
                            //console.log( 'Need to refresh infinite scrolling header...' );
                            output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_current_page" ).val( 1 );
                            output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_page_max" ).val( return_data.page_max );
                            output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_total" ).val( return_data.pdfs_count );
                        } else {
                            pdfs_columns_container.append( return_data.pdfs );
                            //change status control for infinite_scrolling
                            //{ infinite_scrolling: true, scrolling_container: scrolling_container_obj, header : header_obj,  current: current_page, max: max_page }
                            event.header.find( ".bsk_pdfm_infinite_scrolling_header_current_page" ).val( page_to_show );
                            event.header.find( ".bsk_pdfm_infinite_scrolling_header_loading" ).val( 0 );
                        }
                        $( return_data.date_filter ).insertBefore( pdfs_columns_container );
                        $( return_data.pagination ).insertAfter( pdfs_columns_container );
                        
                        //desc
                        if( output_container.find(".bsk-pdfm-count-desc-container").length ){
                            output_container.find(".bsk-pdfm-count-desc-container").find( "h3" ).html( return_data.results_desc );
                        }
                    }
                    
                    //call function to re-set column height
                    //if have fetured image then need call function when all images loaded
                    if( output_container.find(".bsk-pdfm-pdfs-columns-list").find(".bsk-pdfm-pdf-link-for-featured-image img").length > 0 ){
                        output_container.find(".bsk-pdfm-pdfs-columns-list").find(".bsk-pdfm-pdf-link-for-featured-image img").each(function(){
                            $(this).on('load', function() { reset_columns_height_in_eacho_row(); /*console.log("image loaded correctly");*/ });
                        });
                    }else{
                        reset_columns_height_in_eacho_row();
                    }
                }
                
                return;
            }
            
            
            
            /*
             * output for category
             */
            if( shortcode_type == 'category' ){

                /* for infinite_scrolling, only support one category id */
                if ( called_by_infinite_scrolling == false ) {
                    output_container.find(".bsk-pdfm-date-filter").remove();
                    output_container.find(".bsk-pdfm-pagination").remove();
                    output_container.find(".bsk-pdfm-category-output").remove();
                }
                
                var obj_insert_before = output_container.find(".bsk-pdfm-category-shortcode-attr");
                if( output_container.find(".bsk-pdfm-credit-link-container").length > 0 ){
                    obj_insert_before = output_container.find(".bsk-pdfm-credit-link-container");
                }
                
                output_container.find(".bsk-pdfm-category-password-form").remove();
                
                if( output == 'dropdown' ){
                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( obj_insert_before );

                        return;
                    }
                    $( return_data.category_out ).insertBefore( obj_insert_before );

                    //desc
                    if( output_container.find(".bsk-pdfm-count-desc-container").length ){
                        output_container.find(".bsk-pdfm-count-desc-container").find( "h3" ).html( return_data.results_desc );
                    }
                    output_container.find(".bsk-pdfm-pdfs-dropdown").focus();
                }else if( output == 'ul' || output == 'ol' ){
                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( obj_insert_before );

                        return;
                    }
                    
                    /* for infinite_scrolling, out put as only_output_pdfs = yes */
                    if ( called_by_infinite_scrolling == false ) {
                        $( return_data.category_out ).insertBefore( obj_insert_before );
                        $( return_data.pagination ).insertBefore( obj_insert_before );

                        //Need to refresh infinite scrolling header...
                        //console.log( 'Need to refresh infinite scrolling header...' );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_current_page" ).val( 1 );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_page_max" ).val( return_data.page_max );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_total" ).val( return_data.pdfs_count );
                    } else {
                        //append
                        var pdfs_list_container = output_container.find(".bsk-pdfm-pdfs-" + output + "-list");
                        pdfs_list_container.append( return_data.category_out );

                        //reset list-item-odd, list-item-even class
                        var list_item_no = 1;
                        pdfs_list_container.find( ".bsk-pdfm-list-item" ).each( function() {
                            $( this ).removeClass( "list-item-odd" );
                            $( this ).removeClass( "list-item-even" );

                            if ( list_item_no % 2 == 0 ) {
                                $( this ).addClass( "list-item-even" );
                            } else {
                                $( this ).addClass( "list-item-odd" );
                            }
                            list_item_no++;
                        });

                        //change status control for infinite_scrolling
                        //{ infinite_scrolling: true, scrolling_container: scrolling_container_obj, header : header_obj,  current: current_page, max: max_page }
                        event.header.find( ".bsk_pdfm_infinite_scrolling_header_current_page" ).val( page_to_show );
                        event.header.find( ".bsk_pdfm_infinite_scrolling_header_loading" ).val( 0 );
                    }

                    //desc
                    if( output_container.find(".bsk-pdfm-count-desc-container").length ){
                        output_container.find(".bsk-pdfm-count-desc-container").find( "h3" ).html( return_data.results_desc );
                    }
                }else if( output == 'columns' ){
                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( obj_insert_before );

                        return;
                    }

                    /* for infinite_scrolling, out put as only_output_pdfs = yes */
                    if ( called_by_infinite_scrolling == false ) {
                        $( return_data.category_out ).insertBefore( obj_insert_before );
                        $( return_data.pagination ).insertBefore( obj_insert_before );

                        //Need to refresh infinite scrolling header...
                        //console.log( 'Need to refresh infinite scrolling header...' );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_current_page" ).val( 1 );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_page_max" ).val( return_data.page_max );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_total" ).val( return_data.pdfs_count );
                    } else {
                        //append
                        var pdfs_columns_list_container = output_container.find(".bsk-pdfm-pdfs-columns-list");
                        pdfs_columns_list_container.append( return_data.category_out );
                        
                        //change status control for infinite_scrolling
                        //{ infinite_scrolling: true, scrolling_container: scrolling_container_obj, header : header_obj,  current: current_page, max: max_page }
                        event.header.find( ".bsk_pdfm_infinite_scrolling_header_current_page" ).val( page_to_show );
                        event.header.find( ".bsk_pdfm_infinite_scrolling_header_loading" ).val( 0 );
                    }

                    //desc
                    if( output_container.find(".bsk-pdfm-count-desc-container").length ){
                        output_container.find(".bsk-pdfm-count-desc-container").find( "h3" ).html( return_data.results_desc );
                    }
                    
                    //call function to re-set column height
                    //if have fetured image then need call function when all images loaded
                    if( output_container.find(".bsk-pdfm-pdfs-columns-list .bsk-pdfm-pdf-link-for-featured-image img").length > 0 ){
                        output_container.find(".bsk-pdfm-pdfs-columns-list .bsk-pdfm-pdf-link-for-featured-image img").each(function(){
                            $(this).on('load', function() { reset_columns_height_in_eacho_row(); /*console.log("image loaded correctly");*/ });
                        });
                    }else{
                        reset_columns_height_in_eacho_row();
                    }
                }
                
                return;
            } //end for output for category
            
            /*
             * output for selector
             */
            if( shortcode_type == 'selector' ){
                
                /* for infinite_scrolling, only support one category id */
                if ( called_by_infinite_scrolling == false ) {
                    output_container.find(".bsk-pdfm-date-filter").remove();
                    output_container.find(".bsk-pdfm-pagination").remove();
                    output_container.find(".bsk-pdfm-count-desc-container").find("h3").html( "" );
                    output_container.find(".bsk-pdfm-category-output").remove();
                    output_container.find(".bsk-pdfm-category-description").remove();
                }

                if( output == 'dropdown' ){
                    var obj_insert_before = output_container.find(".bsk-pdfm-pdfs-shortcode-attr");
                    if( output_container.find(".bsk-pdfm-credit-link-container").length > 0 ){
                        obj_insert_before = output_container.find(".bsk-pdfm-credit-link-container");
                    }

                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( obj_insert_before );

                        return;
                    }
                    
                    $( return_data.category_out ).insertBefore( obj_insert_before );
                    //desc
                    if( output_container.find(".bsk-pdfm-count-desc-container").length ){
                        output_container.find(".bsk-pdfm-count-desc-container").find( "h3" ).html( return_data.results_desc );
                    }
                    output_container.find(".bsk-pdfm-pdfs-dropdown").focus();
                }else if( output == 'ul' || output == 'ol' ){
                    var obj_insert_before = output_container.find(".bsk-pdfm-pdfs-shortcode-attr");
                    if( output_container.find(".bsk-pdfm-credit-link-container").length > 0 ){
                        obj_insert_before = output_container.find(".bsk-pdfm-credit-link-container");
                    }

                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( obj_insert_before );

                        return;
                    }

                    /* for infinite_scrolling, out put as only_output_pdfs = yes */
                    if ( called_by_infinite_scrolling == false ) {
                        $( return_data.category_out ).insertBefore( obj_insert_before );
                        $( return_data.pagination ).insertBefore( obj_insert_before );

                        //Need to refresh infinite scrolling header...
                        //console.log( 'Need to refresh infinite scrolling header...' );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_current_page" ).val( 1 );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_page_max" ).val( return_data.page_max );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_total" ).val( return_data.pdfs_count );
                    } else {
                        //append
                        var pdfs_list_container = output_container.find(".bsk-pdfm-pdfs-" + output + "-list");
                        pdfs_list_container.append( return_data.category_out );

                        //reset list-item-odd, list-item-even class
                        var list_item_no = 1;
                        pdfs_list_container.find( ".bsk-pdfm-list-item" ).each( function() {
                            $( this ).removeClass( "list-item-odd" );
                            $( this ).removeClass( "list-item-even" );

                            if ( list_item_no % 2 == 0 ) {
                                $( this ).addClass( "list-item-even" );
                            } else {
                                $( this ).addClass( "list-item-odd" );
                            }
                            list_item_no++;
                        });

                        //change status control for infinite_scrolling
                        //{ infinite_scrolling: true, scrolling_container: scrolling_container_obj, header : header_obj,  current: current_page, max: max_page }
                        event.header.find( ".bsk_pdfm_infinite_scrolling_header_current_page" ).val( page_to_show );
                        event.header.find( ".bsk_pdfm_infinite_scrolling_header_loading" ).val( 0 );
                    }
                    
                    //desc
                    if( output_container.find(".bsk-pdfm-count-desc-container").length ){
                        output_container.find(".bsk-pdfm-count-desc-container").find( "h3" ).html( return_data.results_desc );
                    }
                }else if( output == 'columns' ){
                    var obj_insert_before = output_container.find(".bsk-pdfm-pdfs-shortcode-attr");
                    if( output_container.find(".bsk-pdfm-credit-link-container").length > 0 ){
                        obj_insert_before = output_container.find(".bsk-pdfm-credit-link-container");
                    }

                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( obj_insert_before );

                        return;
                    }

                    /* for infinite_scrolling, out put as only_output_pdfs = yes */
                    if ( called_by_infinite_scrolling == false ) {
                        $( return_data.category_out ).insertBefore( obj_insert_before );
                        $( return_data.pagination ).insertBefore( obj_insert_before );

                        //Need to refresh infinite scrolling header...
                        //console.log( 'Need to refresh infinite scrolling header...' );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_current_page" ).val( 1 );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_page_max" ).val( return_data.page_max );
                        output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_total" ).val( return_data.pdfs_count );
                    } else {
                        //append
                        var pdfs_list_container = output_container.find(".bsk-pdfm-pdfs-" + output + "-list");
                        pdfs_list_container.append( return_data.category_out );

                        //change status control for infinite_scrolling
                        //{ infinite_scrolling: true, scrolling_container: scrolling_container_obj, header : header_obj,  current: current_page, max: max_page }
                        event.header.find( ".bsk_pdfm_infinite_scrolling_header_current_page" ).val( page_to_show );
                        event.header.find( ".bsk_pdfm_infinite_scrolling_header_loading" ).val( 0 );
                    }

                    //desc
                    if( output_container.find(".bsk-pdfm-count-desc-container").length ){
                        output_container.find(".bsk-pdfm-count-desc-container").find( "h3" ).html( return_data.results_desc );
                    }
                    //call function to re-set column height
                    //if have fetured image then need call function when all images loaded
                    if( output_container.find(".bsk-pdfm-pdfs-columns-list").find(".bsk-pdfm-pdf-link-for-featured-image img").length > 0 ){
                        output_container.find(".bsk-pdfm-pdfs-columns-list").find(".bsk-pdfm-pdf-link-for-featured-image img").each(function(){
                            $(this).on('load', function() { reset_columns_height_in_eacho_row(); /*console.log("image loaded correctly");*/ });
                        });
                    }else{
                        reset_columns_height_in_eacho_row();
                    }
                }
                
                return;
            } //end for output for category
            
       }); /* //$.post */
        
    }
    
    /*
     * date filter
     */
    function set_validate_date_filter( date_filter_container, current_filter_select ){
        /*
          * refresh selects
          * Year -> Month -> Day / Weekday
          * Month -> Day / Weekday
          * Day -> Weekday
          */
        var availabe_filter_select = new Array( 'year', 'month', 'day', 'weekday' );
        var exist_filter_select = new Array();
        var current_filter_select_str = '';
        var current_filter_select_val = '';
        
        for( var i_filter = 0; i_filter < availabe_filter_select.length; i_filter++ ){
            if( date_filter_container.find(".bsk-pdfm-date-" + availabe_filter_select[i_filter]).length ){
                exist_filter_select.push( availabe_filter_select[i_filter] );
            }
        }
        
        /*
         * create hidden selects
         */
        var first_select_obj = date_filter_container.find(".bsk-pdfm-date-" + availabe_filter_select[0]);
        for( var i_filter = 0; i_filter < availabe_filter_select.length; i_filter++ ){
            var fitler_str = availabe_filter_select[i_filter];
            if( date_filter_container.find(".bsk-pdfm-date-" + fitler_str + '-hidden').length ){
                continue;
            }else{
                var hidden_obj = date_filter_container.find(".bsk-pdfm-date-" + fitler_str).clone();
                hidden_obj.removeClass( "bsk-pdfm-date-" + fitler_str );
                hidden_obj.addClass( "bsk-pdfm-date-" + fitler_str + '-hidden' );
                hidden_obj.hide();
                hidden_obj.insertBefore( first_select_obj );
            }
        }
        

        if( exist_filter_select.length < 2 ){
            //do nothing if only one filter
            return;
        }
        
        if( current_filter_select.hasClass("bsk-pdfm-date-year") ){
            current_filter_select_str = 'year';   
        }else if( current_filter_select.hasClass("bsk-pdfm-date-month") ){
            current_filter_select_str = 'month';   
        }else if( current_filter_select.hasClass("bsk-pdfm-date-day") ){
            current_filter_select_str = 'day';   
        }else if( current_filter_select.hasClass("bsk-pdfm-date-weekday") ){
            current_filter_select_str = 'weekday';   
        }
        current_filter_select_val = current_filter_select.val();
        
        //get all valid dates according to what selected
        var valid_dates = new Array();
        var valid_month_options = new Array();
        var valid_day_options = new Array();
        var valid_weekday_options = new Array();
        $(".bsk-pdfm-valid-date").each(function(){
            switch( current_filter_select_str ){
                case 'year':
                    if( current_filter_select_val && current_filter_select_val != $(this).val().substr(0, 4) ){
                        return;
                    }
                break;
                case 'month':
                    if( current_filter_select_val && current_filter_select_val != $(this).val().substr(5, 2) ){
                        return;
                    }
                    //consider year
                    if( date_filter_container.find(".bsk-pdfm-date-year").length ){
                        var year_val = date_filter_container.find(".bsk-pdfm-date-year").val();
                        if( year_val && year_val != $(this).val().substr(0, 4) ){
                            return;
                        }
                    }
                break;
                case 'day':
                    if( current_filter_select_val && current_filter_select_val != $(this).val().substr(8, 2) ){
                        return;
                    }
                    //consider year, month
                    if( date_filter_container.find(".bsk-pdfm-date-year").length ){
                        var year_val = date_filter_container.find(".bsk-pdfm-date-year").val();
                        if( year_val && year_val != $(this).val().substr(0, 4) ){
                            return;
                        }
                    }
                    if( date_filter_container.find(".bsk-pdfm-date-month").length ){
                        var month_val = date_filter_container.find(".bsk-pdfm-date-month").val();
                        if( month_val && month_val != $(this).val().substr(5, 2) ){
                            return;
                        }
                    }
                break;
                case 'weekday':
                    if( current_filter_select_val && current_filter_select_val != $(this).val().substr(11, 3) ){
                        return;
                    }
                    //consider year, month, day
                    if( date_filter_container.find(".bsk-pdfm-date-year").length ){
                        var year_val = date_filter_container.find(".bsk-pdfm-date-year").val();
                        if( year_val && year_val != $(this).val().substr(0, 4) ){
                            return;
                        }
                    }
                    if( date_filter_container.find(".bsk-pdfm-date-month").length ){
                        var month_val = date_filter_container.find(".bsk-pdfm-date-month").val();
                        if( month_val && month_val != $(this).val().substr(5, 2) ){
                            return;
                        }
                    }
                    if( date_filter_container.find(".bsk-pdfm-date-day").length ){
                        var day_val = date_filter_container.find(".bsk-pdfm-date-day").val();
                        if( day_val && day_val != $(this).val().substr(8, 2) ){
                            return;
                        }
                    }
                break;
            }
            valid_dates.push( $(this).val() );
            valid_month_options.push( $(this).val().substr(5, 2) );
            valid_day_options.push( $(this).val().substr(8, 2) );
            valid_weekday_options.push( $(this).val().substr(11, 3) );
        });
        
        /*
          * Year control Month
          * Month control Day and Weekday
          */
        if( current_filter_select_str == 'year' || current_filter_select_str == 'month' || current_filter_select_str == 'day' ){
            var filter_str_to_ctrl = new Array();
            if( current_filter_select_str == 'year' ){
                filter_str_to_ctrl.push( 'month' );
                filter_str_to_ctrl.push( 'day' );
                filter_str_to_ctrl.push( 'weekday' );
            }else if( current_filter_select_str == 'month' ){
                filter_str_to_ctrl.push( 'day' );
                filter_str_to_ctrl.push( 'weekday' );
            }else if( current_filter_select_str == 'day' ){
                filter_str_to_ctrl.push( 'weekday' );
            }
            for( var i_ctrl = 0; i_ctrl < filter_str_to_ctrl.length; i_ctrl++ ){
                if( date_filter_container.find(".bsk-pdfm-date-" + filter_str_to_ctrl[i_ctrl]).length < 1 ){
                    continue;
                }
                
                //copy all options first
                var hidden_options = date_filter_container.find(".bsk-pdfm-date-" + filter_str_to_ctrl[i_ctrl] + '-hidden').html();
                date_filter_container.find(".bsk-pdfm-date-" + filter_str_to_ctrl[i_ctrl]).html( hidden_options );
                date_filter_container.find(".bsk-pdfm-date-" + filter_str_to_ctrl[i_ctrl]).val("");

                /* show first and then hide */
                date_filter_container.find(".bsk-pdfm-date-" + filter_str_to_ctrl[i_ctrl] + " > option").show();
                switch( filter_str_to_ctrl[i_ctrl] ){
                    case 'month':
                        date_filter_container.find(".bsk-pdfm-date-" + filter_str_to_ctrl[i_ctrl] + " > option").each(function(){
                            if( $(this).val() == "" ){
                                return;
                            }
                            if( valid_month_options.indexOf( $(this).val() ) == -1 ){
                                $(this).remove();
                            }
                        });
                    break;
                    case 'day':
                        date_filter_container.find(".bsk-pdfm-date-" + filter_str_to_ctrl[i_ctrl] + " > option").each(function(){
                            if( $(this).val() == "" ){
                                return;
                            }
                            if( valid_day_options.indexOf( $(this).val() ) == -1 ){
                                $(this).remove();
                            }
                        });
                    break;
                    case 'weekday':
                        date_filter_container.find(".bsk-pdfm-date-" + filter_str_to_ctrl[i_ctrl] + " > option").each(function(){
                            if( $(this).val() == "" ){
                                return;
                            }
                            if( valid_weekday_options.indexOf( $(this).val() ) == -1 ){
                                $(this).remove();
                            }
                        });
                    break;
                }
            } //end for select to ctrl
        }
        //
    }
    
    
    /*
    *
    *  Date filter
    *
    */    
    $(".bsk-pdfm-output-container").on("change", ".bsk-pdfm-date-filter select", function(){
        var output_container = $(this).parents(".bsk-pdfm-output-container");
        var date_weekday_filter_container = $(this).parent(".bsk-pdfm-date-filter");
        var current_changed_select = $(this);

        var shortcode_type = '';
        var output = '';
        if( output_container.hasClass("shortcode-pdfs") ){
            shortcode_type = 'pdfs';
        }else if( output_container.hasClass("shortcode-category") ){
            shortcode_type = 'category';
        }else if( output_container.hasClass("shortcode-selector") ){
            shortcode_type = 'selector';
        }else{
            return;
        }

        if( output_container.hasClass( 'layout-ul' ) ){
            output =  'ul';
        }else if( output_container.hasClass( 'layout-ol' ) ){
            output = 'ol';
        }else if( output_container.hasClass( 'layout-columns' ) ){
            output = 'columns';
        }else if( output_container.hasClass( 'layout-dropdown' ) ){
            output = 'dropdown';
        }else{
            return;
        }
        
        /*
          * refresh selects
          * Year -> Month -> Day / Weekday
          * Month -> Day / Weekday
          * Day -> Weekday
          */
        set_validate_date_filter( date_weekday_filter_container, current_changed_select );
        
        //refresh year month day weekday
        var filter_year = $(this).parent().find(".bsk-pdfm-date-year").val();
        var filter_month = $(this).parent().find(".bsk-pdfm-date-month").val();
        var filter_day = $(this).parent().find(".bsk-pdfm-date-day").val();
        var filter_weekday = $(this).parent().find(".bsk-pdfm-date-weekday").val();

        /*
          * process for pdfs
          */
        if( shortcode_type == 'pdfs' ){
            if( output == 'ul' || output == 'ol' ){
                 var ul_or_ol_parent = output_container.find( ".bsk-pdfm-" + shortcode_type + "-output" );
                 process_date_weekday_filter_for_li( ul_or_ol_parent, output, filter_year, filter_month, filter_day, filter_weekday );
            }else if( output == 'dropdown' ){
                 var dropdown_parent = output_container.find( ".bsk-pdfm-" + shortcode_type + "-output" );
                 process_date_weekday_filter_for_dropdown( dropdown_parent, filter_year, filter_month, filter_day, filter_weekday );
             }else if( output == 'columns' ){
                 var column = $(this).parents(".bsk-pdfm-" + shortcode_type + "-output").data("columns");
                 var column_parent = output_container.find( ".bsk-pdfm-" + shortcode_type + "-output" );
                 process_date_weekday_filter_for_column( column_parent, column, filter_year, filter_month, filter_day, filter_weekday );
             }
        }//end for pdfs
                                       
        /*
          * process for category
          */
        if( shortcode_type == 'category' ){
            if( output == 'ul' || output == 'ol' ){
                output_container.find( ".bsk-pdfm-category-output" ).each(function(){
                    var ul_or_ol_parent = $(this);
                    process_date_weekday_filter_for_li( ul_or_ol_parent, output, filter_year, filter_month, filter_day, filter_weekday );
                });
            }else if( output == 'dropdown' ){
                    var dropdown_parent = $(this).closest( ".bsk-pdfm-category-output" );
                    process_date_weekday_filter_for_dropdown( dropdown_parent, filter_year, filter_month, filter_day, filter_weekday );
             }else if( output == 'columns' ){
                output_container.find( ".bsk-pdfm-category-output" ).each(function(){
                    var column_parent = $(this);
                    var column = $(this).data("columns");
                    process_date_weekday_filter_for_column( column_parent, column, filter_year, filter_month, filter_day, filter_weekday );
                });
             }
        }//end for category
        
        /*
          * process for selector
          */
        if( shortcode_type == 'selector' ){
            if( output == 'ul' || output == 'ol' ){
                output_container.find( ".bsk-pdfm-category-output" ).each(function(){
                    var ul_or_ol_parent = $(this);
                    process_date_weekday_filter_for_li( ul_or_ol_parent, output, filter_year, filter_month, filter_day, filter_weekday );
                });
            }else if( output == 'dropdown' ){
                output_container.find( ".bsk-pdfm-category-output" ).each(function(){
                    var dropdown_parent = $(this);
                    process_date_weekday_filter_for_dropdown( dropdown_parent, filter_year, filter_month, filter_day, filter_weekday );
                });
             }else if( output == 'columns' ){
                output_container.find( ".bsk-pdfm-category-output" ).each(function(){
                    var column_parent = $(this);
                    var column = $(this).data("columns");
                    process_date_weekday_filter_for_column( column_parent, column, filter_year, filter_month, filter_day, filter_weekday );
                });
             }
        }//end for selector
        
    }); //end of filter listener function
    
    function process_date_weekday_filter_for_li( parent_div, ul_ol, filter_year, filter_month, filter_day, filter_weekday ){
        parent_div.find(".bsk-pdfm-pdfs-" + ul_ol + "-list > li").each( function( index, value ){
            var date = $(this).data("date" );
            if( date == "" ){
                return;
            }
            var pdf_year = date.substr( 0, 4 );
            var pdf_month = date.substr( 5, 2 );
            var pdf_day = date.substr( 8, 2 );
            var pdf_weekday = date.substr( 11, 3 );

            if( filter_year && pdf_year != filter_year ){
                $(this).css("display", "none");
                return;
            }
            if( filter_month && pdf_month != filter_month ){
                $(this).css("display", "none");
                return;
            }
            if( filter_day && pdf_day != filter_day ){
                $(this).css("display", "none");
                return;
            }
            if( filter_weekday && pdf_weekday != filter_weekday ){
                $(this).css("display", "none");
                return;
            }
            $(this).css("display", "list-item");
        }); //end of process pdfs

        //reset list-item class
        var i_list_item = 1;
        parent_div.find(".bsk-pdfm-pdfs-" + ul_ol + "-list > li").each( function( index, value ){
            $(this).removeClass("list-item-odd");
            $(this).removeClass("list-item-even");
            if( $(this).css("display") == "none" ){
                return;
            }
            if( i_list_item % 2 == 0 ){
                $(this).addClass( "list-item-even" );
            }else{
                $(this).addClass( "list-item-odd" );
            }
            i_list_item++;
        });
    }
    
    function process_date_weekday_filter_for_dropdown( parent_div, filter_year, filter_month, filter_day, filter_weekday ){
        
        if( parent_div.find(".bsk-pdfm-pdfs-dropdown").length < 1 ){
            return;
        }
        //check if hidden dropdown exist
        if( parent_div.find(".bsk-pdfm-pdfs-hidden-dropdown").length < 1 ){
            var hidden_dropdown_obj = parent_div.find(".bsk-pdfm-pdfs-dropdown").clone();
            hidden_dropdown_obj.removeClass("bsk-pdfm-pdfs-dropdown");
            hidden_dropdown_obj.addClass("bsk-pdfm-pdfs-hidden-dropdown");
            hidden_dropdown_obj.hide();
            hidden_dropdown_obj.insertAfter( parent_div.find(".bsk-pdfm-pdfs-dropdown") );
        }else{
            //copy options from hidden
            parent_div.find(".bsk-pdfm-pdfs-dropdown").html( parent_div.find(".bsk-pdfm-pdfs-hidden-dropdown").html() );
        }
        
        var options = null;
        if( parent_div.find(".bsk-pdfm-pdfs-dropdown optgroup").length ){
            options = parent_div.find(".bsk-pdfm-pdfs-dropdown optgroup > option");
        }else{
            options = parent_div.find(".bsk-pdfm-pdfs-dropdown > option");
        }
        $.each( options, function( index, value ) {
            var date = $(this).prop("id");
            if( date == "" ){
                return;
            }

            var pdf_year = date.substr( 0, 4 );
            var pdf_month = date.substr( 5, 2 );
            var pdf_day = date.substr( 8, 2 );
            var pdf_weekday = date.substr( 11, 3 );

            if( filter_year && pdf_year != filter_year ){
                $(this).remove();
                return;
            }
            if( filter_month && pdf_month != filter_month ){
                $(this).remove();
                return;
            }
            if( filter_day && pdf_day != filter_day ){
                $(this).remove();
                return;
            }
            if( filter_weekday && pdf_weekday != filter_weekday ){
                $(this).remove();
                return;
            }
        });
    }

    function process_date_weekday_filter_for_column( parent_div, column, filter_year, filter_month, filter_day, filter_weekday ){
        parent_div.find(".bsk-pdfm-pdfs-columns-list > div").each(function(){
            var date = $(this).data("date");
            if( date == "" ){
                return;
            }

            $(this).removeClass( "bsk-pdfm-first" );

            var pdf_year = date.substr( 0, 4 );
            var pdf_month = date.substr( 5, 2 );
            var pdf_day = date.substr( 8, 2 );
            var pdf_weekday = date.substr( 11, 3 );
            if( filter_year && pdf_year != filter_year ){
                $(this).css("display", "none");
                return;
            }
            if( filter_month && pdf_month != filter_month ){
                $(this).css("display", "none");
                return;
            }
            if( filter_day && pdf_day != filter_day ){
                $(this).css("display", "none");
                return;
            }
            if( filter_weekday && pdf_weekday != filter_weekday ){
                $(this).css("display", "none");
                return;
            }
            $(this).css("display", "block");
        });

        //refresh column display or not
        function reset_columns_class( column_parent_div ){
            var current_index = 0;
            column_parent_div.find(".bsk-pdfm-pdfs-columns-list > div").each(function(){
                if( $(this).css("display") != "block" ){
                    return;
                }
                if( current_index % column == 0 ){
                    $(this).addClass( "bsk-pdfm-first" );
                }
                current_index++;
            });
        }
        $.when( reset_columns_class( parent_div ) ).done(function( x ) {
            //need reset column height, as column height is by row
            reset_columns_height_in_eacho_row();
        });   
    }
    
    
    
    /*
      * Columns - make each row have same height
      */
    if( $(".pdfs-in-columns").length > 0 ){
        output_container = $(".bsk-pdfm-output-container");
        if( output_container.find(".bsk-pdfm-pdfs-columns-list .bsk-pdfm-pdf-link-for-featured-image img").length > 0 ){

            output_container.find(".bsk-pdfm-pdfs-columns-list .bsk-pdfm-pdf-link-for-featured-image img").each(function(){
                $(this).on( 
                            'load', 
                            function() { 
                                reset_columns_height_in_eacho_row(); 
                                /*console.log("image loaded correctly");*/
                            }
                          );
            });
        }else{
            reset_columns_height_in_eacho_row();
        }

        $( window ).resize(function() {
            output_container = $(".bsk-pdfm-output-container");
            if( output_container.find(".bsk-pdfm-pdfs-columns-list .bsk-pdfm-pdf-link-for-featured-image img").length > 0 ){
                
                output_container.find(".bsk-pdfm-pdfs-columns-list .bsk-pdfm-pdf-link-for-featured-image img").each(function(){
                    $(this).on('load', function() { reset_columns_height_in_eacho_row(); /*console.log("image loaded correctly");*/ });
                });
            }else{
                reset_columns_height_in_eacho_row();
            }
        });
        
        var reset_when_scroll = false;
        $( window ).scroll(function() {
            if( reset_when_scroll == false ){
                output_container = $(".bsk-pdfm-output-container");
                if( output_container.find(".bsk-pdfm-pdfs-columns-list .bsk-pdfm-pdf-link-for-featured-image img").length > 0 ){
                    output_container.find(".bsk-pdfm-pdfs-columns-list .bsk-pdfm-pdf-link-for-featured-image img").each(function(){
                        $(this).on('load', function() { reset_columns_height_in_eacho_row(); /*console.log("image loaded correctly");*/ });
                    });
                }else{
                    reset_columns_height_in_eacho_row();
                }
                reset_when_scroll = true;
            }
        });
    }
    
    function reset_columns_height_in_eacho_row(){
        $(".pdfs-in-columns").each(function(){
            var columns = $(this).data( "columns" );
            if( columns < 2 ){
                return;
            }
            //get first
            $(this).find(".bsk-pdfm-first").each(function(){
                // reset the height
                $(this).css({'height':'auto'});
                var first_column_height = $(this).height();
                var max_height = first_column_height;
                //get others in the row
                var temp_obj = $(this);
                while( temp_obj.next(".bsk-pdfm-columns-single").length && !temp_obj.next(".bsk-pdfm-columns-single").hasClass("bsk-pdfm-first") ){
                    temp_obj = temp_obj.next(".bsk-pdfm-columns-single");
                    if( temp_obj.css("display") != "block" ){
                        continue;
                    }
                    temp_obj.css({'height':'auto'});
                    //console.log( temp_obj.height() );
                    if( temp_obj.height() > max_height ){
                        max_height = temp_obj.height();
                    }
                }

                //set height to the row
                $(this).height( max_height );
                var temp_obj = $(this);
                while( temp_obj.next(".bsk-pdfm-columns-single").length && !temp_obj.next(".bsk-pdfm-columns-single").hasClass("bsk-pdfm-first") ){
                    temp_obj = temp_obj.next(".bsk-pdfm-columns-single");
                    if( temp_obj.css("display") != "block" ){
                        continue;
                    }
                    temp_obj.height( max_height );
                }
            });
        });
    }
    
    /*
      * Download / Open statistics
      */
    $(".bsk-pdfm-output-container").on("click", ".bsk-pdfm-pdf-link-for-title, .bsk-pdfm-pdf-link-for-featured-image", function( e ){

        var output_container = $(this).parents(".bsk-pdfm-output-container");
        
        //check if permalink enable
        if( output_container.find( ".bsk_pdfm_settings_enalbe_permalink_cls" ).val() > 0 ){
            return;
        }
        
        if( output_container.find(".bsk-pdfm-statistics-ajax-nonce").length < 1 ){
            //console.log( 'No statistics enabled' );
            return;
        }
        
        var anchor_id = $(this).attr( "id" );
        
        if( !$(this).hasClass( 'bsk-pdfm-statistics-done' ) ){
            e.preventDefault();
            
            var ajax_nonce = output_container.find(".bsk-pdfm-statistics-ajax-nonce").val();
            var pdf_id = 0;
            if( $(this).parents( ".bsk-pdfm-list-item" ).length ){
                pdf_id = $(this).parents( ".bsk-pdfm-list-item" ).data( "id" );
            }else if( $(this).parents( ".bsk-pdfm-columns-single" ).length ){
                pdf_id = $(this).parents( ".bsk-pdfm-columns-single" ).data( "id" );
             }

            if( pdf_id < 1 ){
                //console.log( 'Invalid PDF id' );
                return;
            }
            var action_val = 'pdfs_statistics_update_download_count';
            var data = { action: action_val, id: pdf_id, nonce: ajax_nonce };

            $.post( bsk_pdf_pro.ajaxurl, data, function(response) {
                //do nothing
                $('#' + anchor_id ).addClass( 'bsk-pdfm-statistics-done' );
                $('#' + anchor_id )[0].click();
            });
        }else{
             $(this).removeClass( 'bsk-pdfm-statistics-done' );
        }
    });

    $( ".bsk-pdfm-pdf-link-statics" ).click( function() {

        if( !$(this).hasClass( 'bsk-pdfm-statistics-done' ) ){
            
            var pdf_id = $(this).data( "pdf-id" );
            if( pdf_id < 1 ){
                //console.log( 'Invalid PDF id' );
                return;
            }
            var action_val = 'pdfs_statistics_update_download_count';
            var data = { action: action_val, id: pdf_id, nonce: 'LINK_ONLY_NO_NONCE' };
            //console.log( pdf_id );
            $.post( bsk_pdf_pro.ajaxurl, data, function(response) {
                //do nothing
                $(this).addClass( 'bsk-pdfm-statistics-done' );
                $(this).click();
            });
        }else{
             $(this).removeClass( 'bsk-pdfm-statistics-done' );
        }
    });
    
    /*
     *
     * Selector
     * dropdown change
     *
    */
    $(".bsk-pdfm-category-selector-container .bsk-pdfm-category-dropdown").change(function(){
        var output_container = null;
        var selector_container = $(this).parent();
        var output;
        
        if( $(this).parents(".bsk-pdfm-output-container").length ){
            output_container = $(this).parents(".bsk-pdfm-output-container");
        }else if( $(this).parents(".bsk-pdfm-widget-output-container").length ){
            output_container = $(this).parents(".bsk-pdfm-widget-output-container");
        }else{
            return;
        }
        
        if( output_container.hasClass( 'layout-ul' ) ){
            output =  'ul';
        }else if( output_container.hasClass( 'layout-ol' ) ){
            output = 'ol';
        }else if( output_container.hasClass( 'layout-columns' ) ){
            output = 'columns';
        }else if( output_container.hasClass( 'layout-dropdown' ) ){
            output = 'dropdown';
        }else{
            return;
        }
        
        //
        // remove category out, pagintaion, 
        // reset title filter, extension filter, date-weekday query filter, tags filter, search bar
        //
        output_container.find(".bsk-pdfm-error-message").remove();
        output_container.find(".bsk-pdfm-category-description").remove();
        output_container.find(".bsk-pdfm-category-output").remove();
        output_container.find(".bsk-pdfm-date-filter").remove();
        output_container.find(".bsk-pdfm-pagination").remove();
        output_container.find(".bsk-pdfm-count-desc-container").remove();
        output_container.find(".bsk-pdfm-extension-filter-container").remove();
        output_container.find(".bsk-pdfm-title-filter-container").remove();
        output_container.find(".bsk-pdfm-date-weekday-query-filter").remove();
        output_container.find(".bsk-pdfm-tags-filter-container").remove();
        output_container.find(".bsk-pdfm-search-bar").remove();
        
        
        //load category out by ajax
        var category_id = $(this).val();
        if( category_id < 1 ){
            return;
        }
        
        var ajax_nonce = output_container.find(".bsk-pdfm-selector-ajax-nonce").val();
        var action_val = 'pdfs_get_selector_' + output;
        var data = { action: action_val, layout: output, nonce: ajax_nonce };
        output_container.find(".bsk-pdfm-shortcode-attr").each(function(index, value ){
            var attr_name = $(this).data("attr_name");
            data[attr_name] = $(this).val();
        });
        data['default_cat_id'] = category_id;
        selector_container.find(".bsk-pdfm-category-selector-ajax-loader").css( "display", "inline-block" );
        
        $.post( bsk_pdf_pro.ajaxurl, data, function(response) {
            /*console.log( response );
            return;*/
            selector_container.find(".bsk-pdfm-category-selector-ajax-loader").css( "display", "none" );
            
            var obj_insert_before = output_container.find(".bsk-pdfm-pdfs-shortcode-attr");
            if( output_container.find(".bsk-pdfm-credit-link-container").length > 0 ){
                obj_insert_before = output_container.find(".bsk-pdfm-credit-link-container");
            }
            var category_selector_obj = output_container.find(".bsk-pdfm-category-selector-container");
            
            var return_data = $.parseJSON( response );
            if( return_data.error_message ){
                $( return_data.error_message ).insertBefore( obj_insert_before );
                
                return;
            }
            
            if( output == 'dropdown' ){
                $( return_data.selected_category_out ).insertAfter( category_selector_obj );
                output_container.find(".bsk-pdfm-pdfs-dropdown").focus();
            }else if( output == 'ul' || output == 'ol' ){
                $( return_data.selected_category_out ).insertAfter( category_selector_obj );

                //refresh bsk_pdfm_infinite_scrolling_header
                output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_current_page" ).val( 1 );
                output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_page_max" ).val( return_data.page_max );
                output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_total" ).val( return_data.pdfs_count );
            }else if( output == 'columns' ){
                $( return_data.selected_category_out ).insertAfter( category_selector_obj );

                //refresh bsk_pdfm_infinite_scrolling_header
                output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_current_page" ).val( 1 );
                output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_page_max" ).val( return_data.page_max );
                output_container.find( ".bsk_pdfm_infinite_scrolling_header .bsk_pdfm_infinite_scrolling_header_total" ).val( return_data.pdfs_count );

                //call function to re-set column height
                //if have fetured image then need call function when all images loaded
                if( output_container.find(".bsk-pdfm-pdfs-columns-list").find(".bsk-pdfm-pdf-link-for-featured-image img").length > 0 ){
                    output_container.find(".bsk-pdfm-pdfs-columns-list").find(".bsk-pdfm-pdf-link-for-featured-image img").each(function(){
                        $(this).on('load', function() { reset_columns_height_in_eacho_row(); /*console.log("image loaded correctly");*/ });
                    });
                }else{
                    reset_columns_height_in_eacho_row();
                }
            }
            
       }); /* //$.post */
    });
    
    /*
     * Wdiget
     * Pagination, Search
     */
    $(".bsk-pdfm-widget-output-container").on("click", ".bsk-pdfm-pagination a, .bsk-pdfm-search-input button, .bsk-pdfm-search-results a", function(){
        
        var output_container = $(this).closest(".bsk-pdfm-widget-output-container");
        var shortcode_type = '';
        var output = '';
        if( output_container.hasClass("widget-pdfs") ){
            shortcode_type = 'pdfs';
        }else if( output_container.hasClass("widget-category") ){
            shortcode_type = 'category';
        }else if( output_container.hasClass("widget-selector") ){
            shortcode_type = 'selector';
        }else{
            return;
        }

        if( output_container.hasClass( 'layout-ul' ) ){
            output =  'ul';
        }else if( output_container.hasClass( 'layout-ol' ) ){
            output = 'ol';
        }else{
            return;
        }

        //clear error message
        output_container.find(".bsk-pdfm-error-message").remove();
        
        var keywords_val = '';
        var search_cat_id_val = '';
        var search_year_of_val = '';
        var start_with = '';
        

        /*
          for search bar 
          */
        if( $(this).hasClass("bsk-pdfm-search-anchor") || $(this).hasClass("bsk-pdfm-search-clear-anchor") ){
            var search_input_obj = $(this).parents(".bsk-pdfm-search-bar").find(".bsk-pdfm-search-input");
            
            if( $(this).hasClass("bsk-pdfm-search-clear-anchor") ){
                search_input_obj.find(".bsk-pdfm-search-keywords").val( "" );
                search_input_obj.find(".bsk-pdfm-year-dropdown").val( "" );
                search_input_obj.find(".bsk-pdfm-category-dropdown").val( "" );
            }
            
            var search_reulsts_label_obj = $(this).parents(".bsk-pdfm-search-bar").find(".bsk-pdfm-search-results");
            search_reulsts_label_obj.css("display", "block");
            search_reulsts_label_obj.find(".bsk-pdfm-searchbar-ajax-loader").css( "display", "inline-block" );
            search_reulsts_label_obj.find(".bsk-pdfm-search-results-desc").css( "display", "none" );
            
            //refresh pagination
            output_container.find(".bsk-pdfm-pagination").find("li").removeClass("active");
        }
        if( output_container.find( ".bsk-pdfm-search-bar" ).length > 0 ){
            var search_input_obj = output_container.find(".bsk-pdfm-search-input");
            keywords_val = search_input_obj.find(".bsk-pdfm-search-keywords").val();
            keywords_val = $.trim( keywords_val );
            keywords_input_placeholder = search_input_obj.find(".bsk-pdfm-search-keywords").attr("placeholder");
            if( keywords_val == keywords_input_placeholder ){
                keywords_val = '';
            }
            if( search_input_obj.find(".bsk-pdfm-year-dropdown").length ){
                search_year_of_val = search_input_obj.find(".bsk-pdfm-year-dropdown").val();
            }
            if( search_input_obj.find(".bsk-pdfm-category-dropdown").length ){
                search_cat_id_val = search_input_obj.find(".bsk-pdfm-category-dropdown").val();
            }
        }
        
        /* 
          * for pagination
          */
        var page_to_show = 1;
        if( $(this).hasClass( "bsk-pdfm-pagination-anchor" ) ){ //pagination anchor
            if( $(this).parent().hasClass("active") ){
                //click on active pagination anchor
                return;
            }
            page_to_show = $(this).data("page");
            output_container.find(".bsk-pdfm-pagination-ajax-loader").css( "display", "inline-block" );
        }else if( output_container.find(".bsk-pdfm-pagination").length ){
            page_to_show = output_container.find(".bsk-pdfm-pagination").find("li.active").find("a").data("page");
        }
        
        var ajax_nonce = output_container.find(".bsk-pdfm-" + shortcode_type + "-ajax-nonce").val();
        var action_val = "pdfs_get_" + shortcode_type + "_" + output;
        var data = { action: action_val, layout: output, nonce: ajax_nonce };
        
        //organise ajax parameters
        output_container.find(".bsk-pdfm-shortcode-attr").each(function(index, value ){
            var attr_name = $(this).data("attr_name");
            data[attr_name] = $(this).val();
        });
        
        if( search_cat_id_val ){
            data['search_cat_id'] = search_cat_id_val;
            //means under search mode
            //in this mode only search PDFs from the selected category so close hierarchical temporarily
            data['hierarchical'] = 'no';
        }
        
        if( search_year_of_val ){
            data['year_of'] = search_year_of_val;
        }

        data['paged'] = page_to_show;
        data['keywords'] = keywords_val;

        /*
          * for category selector
          */
        if( shortcode_type == 'selector' ){
            data['action'] = "pdfs_get_category_" + output;
            data['nonce'] = output_container.find(".bsk-pdfm-category-ajax-nonce").val();
            data['id'] = output_container.find(".bsk-pdfm-category-selector-container").find(".bsk-pdfm-category-dropdown").val();
            //unser selector mode for showing PDF results, hierarchical is always closed
            data['hierarchical'] = 'no';
        }
        
        
        /*console.log( data );
        return;*/
        $.post( bsk_pdf_pro.ajaxurl, data, function(response) {
            /*console.log( response );
            return;*/
            var return_data = $.parseJSON( response );
            
            /*
              * process search bar
            */
            if( output_container.find(".bsk-pdfm-search-results").length ){
                
                var search_reulsts_container = output_container.find(".bsk-pdfm-search-results");
                
                search_reulsts_container.find(".bsk-pdfm-searchbar-ajax-loader").css("display", "none");
                if( keywords_val == "" && search_year_of_val == "" && search_cat_id_val == "" ){
                    search_reulsts_container.css("display", "none");
                }else{
                    search_reulsts_container.css("display", "block");
                    search_reulsts_container.find(".bsk-pdfm-search-clear-anchor").css("display", "inline-block");
                }
                
            }
            

            /*
             * output for pdfs
             */
            if( shortcode_type == 'pdfs' ){

                output_container.find(".bsk-pdfm-pagination").remove();
                
                if( output == 'dropdown' ){
                    output_container.find(".bsk-pdfm-pdfs-dropdown").focus();
                }else if( output == 'ul' || output == 'ol' ){
                    var pdfs_list_container = output_container.find(".bsk-pdfm-pdfs-" + output + "-list");
                    pdfs_list_container.html( "" );
                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( pdfs_list_container );
                    }else{
                        pdfs_list_container.html( return_data.pdfs );
                        $( return_data.date_filter ).insertBefore( pdfs_list_container );
                        $( return_data.pagination ).insertAfter( pdfs_list_container );
                    }                    
                }else if( output == 'columns' ){
                
                }
                
                return;
            }
            
            
            
            /*
             * output for category
             */
            if( shortcode_type == 'category' ){
                output_container.find(".bsk-pdfm-pagination").remove();
                output_container.find(".bsk-pdfm-category-output").remove();
                
                var obj_insert_before = output_container.find(".bsk-pdfm-pdfs-shortcode-attr");
                if( output_container.find(".bsk-pdfm-credit-link-container").length > 0 ){
                    obj_insert_before = output_container.find(".bsk-pdfm-credit-link-container");
                }
                
                
                if( output == 'dropdown' ){
                    output_container.find(".bsk-pdfm-pdfs-dropdown").focus();
                }else if( output == 'ul' || output == 'ol' ){
                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( obj_insert_before );

                        return;
                    }
                    
                    $( return_data.category_out ).insertBefore( obj_insert_before );
                    $( return_data.pagination ).insertBefore( obj_insert_before );
                }else if( output == 'columns' ){
                    
                }
                
                return;
            } //end for output for category
            
            /*
             * output for selector
             */
            if( shortcode_type == 'selector' ){
                
                output_container.find(".bsk-pdfm-category-output").remove();
                output_container.find(".bsk-pdfm-pagination").remove();

                if( output == 'dropdown' ){
                    output_container.find(".bsk-pdfm-pdfs-dropdown").focus();
                }else if( output == 'ul' || output == 'ol' ){
                    var obj_insert_before = output_container.find(".bsk-pdfm-pdfs-shortcode-attr");
                    if( output_container.find(".bsk-pdfm-credit-link-container").length > 0 ){
                        obj_insert_before = output_container.find(".bsk-pdfm-credit-link-container");
                    }

                    if( return_data.error_message ){
                        $( return_data.error_message ).insertBefore( obj_insert_before );

                        return;
                    }

                    $( return_data.category_out ).insertBefore( obj_insert_before );
                    $( return_data.pagination ).insertBefore( obj_insert_before );
                }else if( output == 'columns' ){
                    
                }
            } //end for output for category
            
       }); /* //$.post */
       
       output_container.resize();
    });

    /**************************************************
     *
     * Infinite Scrolling
     *
     **************************************************/
    $( window ).scroll( function () { 

        if ( $( ".bsk_pdfm_infinite_scrolling_container" ).length < 1 ||
             $( ".bsk_pdfm_infinite_scrolling_container" ).length > 1 ||
             $( ".bsk_pdfm_infinite_scrolling_header" ).length < 1 || 
             $( ".bsk_pdfm_infinite_scrolling_header" ).length > 1 ) {

            return;
        }

        var scrolling_container_obj = $( ".bsk_pdfm_infinite_scrolling_container" );
        var header_obj = scrolling_container_obj.find( ".bsk_pdfm_infinite_scrolling_header" );

        var current_page = header_obj.find( ".bsk_pdfm_infinite_scrolling_header_current_page" ).val();
        var max_page = header_obj.find( ".bsk_pdfm_infinite_scrolling_header_page_max" ).val();

        current_page = parseInt( current_page );
        max_page = parseInt( max_page );

        if ( max_page < 2 || current_page >= max_page ) {
            //console.log( current_page, max_page );
            return;
        }

        var loading_status = header_obj.find( ".bsk_pdfm_infinite_scrolling_header_loading" ).val();
        if ( loading_status > 0 ) {
            //console.log( 'Lock loading....' );
            return;
        }

        if ( $(window).scrollTop() >= $(document).height() - $(window).height() - 10 ) {
            header_obj.find( ".bsk_pdfm_infinite_scrolling_header_loading" ).val( 1 )

            current_page++;
            //call function to refresh pdfs, 
            //needs to append ajax loader and set status fields' value in ajax callback function
            ajax_query_pdfs_function( { infinite_scrolling: true, scrolling_container: scrolling_container_obj, header : header_obj,  current: current_page, max: max_page } );
            
            //var ajax_loader = $( "#bsk_pdfm_infinite_scrolling_ajax_loader_ID" ).html();
            //var ajax_loader_p = '<p id="bsk_pdfm_infinite_scrolling_ajax_loader_ID">' + ajax_loader + '</p>';
            //$( "#bsk_pdfm_infinite_scrolling_container_ID" ).append( ajax_loader_p );
            /*$.post( ajaxurl, data, function(response) {
                $( "#bsk_pdfm_infinite_scrolling_ajax_loader_ID" ).remove();
    
                var return_data = $.parseJSON( response );
                
                $( "#bsk_pdfm_infinite_scrolling_header_current_page_ID" ).val( current_page );
                $( "#bsk_pdfm_infinite_scrolling_ajax_ID" ).append( return_data.data );
                
                $( "#bsk_pdfm_infinite_scrolling_header_loading_ID" ).val( 0 );
                //console.log( 'Unlock loading....' );
            });*/
        }
        
    });

    /**************************************************
     *
     * Embedded PDF Viewer
     *
     **************************************************/
    function is_mobile_device() {
		if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test( navigator.userAgent ) ) {
			return true;
		}

		return false;
	}

    $( ".bsk-pdfm-output-container.embeded-pdf-container" ).each ( function() {
        var pdf_id = $( this ).data( "id" );
        var disable_viewer_mobile = $( this ).data( "disable_viewer_on_mobile" ).toUpperCase();
        var show_download_on_mobile = $( this ).data( "show_download_on_mobile" ).toUpperCase();
        var show_download_on_desktop = $( this ).data( "show_download_on_desktop" ).toUpperCase();

        if ( is_mobile_device() ) {
            if ( disable_viewer_mobile == 'YES' ) {
                $( "#bsk_pdfm_embeded_pdf_iframe_ID_" + pdf_id ).css( "display", "none" );
            } else {
                $( "#bsk_pdfm_embeded_pdf_iframe_ID_" + pdf_id ).attr( 'src', $( "#bsk_pdfm_embeded_pdf_viewer_url_ID_" + pdf_id ).val() );
            }

            if ( show_download_on_mobile == 'YES' ) {
                $( "#bsk_pdfm_embeded_pdf_download_link_p_ID_" + pdf_id ).css( "display", "block" );
            } else {
                $( "#bsk_pdfm_embeded_pdf_download_link_p_ID_" + pdf_id ).css( "display", "none" );
            }
        } else {
            
            $( "#bsk_pdfm_embeded_pdf_iframe_ID_" + pdf_id ).attr( 'src', $( "#bsk_pdfm_embeded_pdf_viewer_url_ID_" + pdf_id ).val() );

            if ( show_download_on_desktop == 'YES' ) {
                $( "#bsk_pdfm_embeded_pdf_download_link_p_ID_" + pdf_id ).css( "display", "block" );
            } else {
                $( "#bsk_pdfm_embeded_pdf_download_link_p_ID_" + pdf_id ).css( "display", "none" );
            }
        }
    });

});
