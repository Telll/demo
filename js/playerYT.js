/* player.js
 * implements a player using projekktor
 * Author: Monsenhor <monsenhor@cpan.org>
 * Date: 2015 Aug
 * Needs telll.js Version: 0.15
 */

var theHeight;
var moviePosition;
var authKey;
var deviceModel;
var user;
var photolinksSent=[];
var actualPhotolink = 0;
var highlightedPhotolink = 0;
var phListSize = 7;
var phListElementWidth = 77;
var agent = navigator.userAgent.toLowerCase();
var playMovie;

// detect ios
var isiOS = false;
if(agent.indexOf('iphone') >= 0 || agent.indexOf('ipad') >= 0){
    isiOS = true;
}
// detect android
var isAndroid = false;
if(agent.indexOf('android') >= 0 ){
       isAndroid = true;
}
// play movie at youtube
var isYoutube = false;
if (location.search.indexOf("?youtube") >= 0) {
   isYoutube = true;
   console.log('Its Youtube');
} 

(function($){
    // Create event to listen when jquery changes a class
    // We need that to trigger the projekktor toolbar and reposition the warn tool
    var originalAddClassMethod = $.fn.addClass;
    $.fn.addClass = function(){
        var result = originalAddClassMethod.apply( this, arguments );
        // trigger a custom event
        $(this).trigger('cssClassChanged');
        return result;
    }
    // Create the QueryString jQuery plugin
    $.queryString = (function(a) {
        console.log('Query string:' + a);
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        console.log('Sol:');
        console.log(b);
        return b;
    })(window.location.search.substr(1).split('&'));

    // Create the doubletap plugin
    // based on http://appcropolis.com/blog/howto/implementing-doubletap-on-iphones-and-ipads/
    $.fn.doubletap = function(onDoubleTapCallback, onTapCallback, delay){
        var eventName, action;
        delay = delay == null? 500 : delay;
        eventName = isiOS == true || isAndroid == true ? 'touchend' : 'click';
 
        $(this).on(eventName, function(event){
            var now = new Date().getTime();
            /** the first time this will make delta a negative number */
            var lastTouch = $(this).data('lastTouch') || now + 1;
            var delta = now - lastTouch;
            clearTimeout(action);
            if(delta<500 && delta>0){
                if(onDoubleTapCallback != null && typeof onDoubleTapCallback == 'function'){
                    event.preventDefault();
                    onDoubleTapCallback(event);
                }
            }else{
                $(this).data('lastTouch', now);
                action = setTimeout(function(evt){
                    if(onTapCallback != null && typeof onTapCallback == 'function'){
                        event.preventDefault();
                        onTapCallback(event);
                    }
                    clearTimeout(action);   // clear the timeout
                }, delay, [event]);
            }
            $(this).data('lastTouch', now);
        });
        return this;
    };
})(jQuery);

jQuery.noConflict();
jQuery( document ).ready(function( $ ) {
    //var tws      = new Tws();
    //var myMovies     = tws.getMovies('featured');
    //var myMovie      = tws.getMovie('000');
    //var myPhotolinks = tws.getPhotolinks(myMovie.id);
    //var myTrackms    = tws.getTrackms(myMovie.id);
    moviePosition = 0;
    $('#telll-controls').slideDown();
    var panelOpen = 1;

    // mantain the full window viewport
    _fullWindow();
    flashBalls();
    $( window ).resize(function() {
        _fullWindow();
    });
    $(window).on('orientationchange', function(event) {
        _fullWindow();
    });
    /** Create top control
     * TODO: make a class
    */
    // inject navbar on control top
    //$('#telll-top-controls').append($('#mainnav'));
    //$('#mainnav').css('margin-top','3px');

    /** Create top controls
     * TODO: make a class
    topOpen = 0;
    $( document ).on( "mousemove", function( event ) {
         if (event.pageY < 40 && topOpen == 0){
             $('#telll-top-controls').slideDown();
             setTimeout(function(){topOpen = 1;},600);
         }
    });
    $( document ).on( "touchstart", function( event ) {
         if (event.pageY < 40 && topOpen == 0){
             $('#telll-top-controls').slideDown();
             setTimeout(function(){topOpen = 1;},600);
         }
    });
    $('#telll-top-controls').on("touchstart" , function(event){
         if (topOpen == 1){
             setTimeout(function(){$('#telll-top-controls').slideUp();},5000);
             setTimeout(function(){topOpen = 0;},5600);
         }
    });
    $('#telll-top-controls').on("mouseleave" , function(event){
         if (topOpen == 1){
             setTimeout(function(){$('#telll-top-controls').slideUp();},5000);
             setTimeout(function(){topOpen = 0;},5600);
         }
    });
    $('#menu-item-0').on('click', function(e){window.location.href='/';e.preventDefault();});
//    $('#menu-item-1').on('click', function(e){window.location.href='/dashboard';e.preventDefault();});
    $('#menu-item-2').on('click', function(e){window.location.href='/clickbox.html';e.preventDefault();});
    $('#menu-item-3').on('click', function(e){window.location.href='/player.html';e.preventDefault();});
 
     */
    /** Create panel controls
     * TODO: make a class
     */
    //panelOpen = 0;
    $( document ).on( "touchstart", function( event ) {
         if (event.pageY > (theHeight - 120) && panelOpen == 0){
             $('#telll-controls').slideDown();
             //$('#telll-pkt').animate({height:"-=50"},600);
             panelOpen = 1;
         }
    });
    $( document ).on( "touchstart", function( event ) {
         if (event.pageY < (theHeight - 160) && panelOpen == 1){
             setTimeout(function(){ $('#telll-controls').slideUp(); },5000);
             setTimeout(function(){ panelOpen = 0; },5600);
         }
    });
    $( document ).on( "mousemove", function( event ) {
         if (event.pageY > (theHeight - 120) && panelOpen == 0){
             $('#telll-controls').slideDown();
             panelOpen = 1;
         }
    });
    $( document ).on( "mousemove", function( event ) {
         if (event.pageY < (theHeight - 160) && panelOpen == 1){
             setTimeout(function(){ $('#telll-controls').slideUp(); },5000);
             setTimeout(function(){ panelOpen = 0; },5600);
         }
    });


    createPhotolinksPanel(); // TODO it must be myPhpnl = new PhPanel();
/*
    $('#telll-warn').on('click',function(e){
        tagDefaultView();
        sendPhotolink(actualPhotolink);
    });
    $('#telll-warn').on('touchstart',function(e){
        tagDefaultView();
        sendPhotolink(actualPhotolink);
    });
    //$('#telll-warn').dblclick(function (e) {
*/
    // the telll warn tool// TODO it must be twrn = new TWarn();
    $('#telll-warn').doubletap(function (e) {
        console.log('Double Click!!!');
        thePlayer.setPause();
        // Show clickbox
        showClickbox();
        /*
        // show dialog with photolinked webpage
        $('body').append('<div id="ph-dialog-'+actualPhotolink+'"><iframe width="100%" height="100%" src="/cgi-bin/mirror.pl?url='+myPhotolinks[actualPhotolink].links[0].url+'"></div>');
        $( "#ph-dialog-"+actualPhotolink ).dialog({
               modal: true,
               width: '80%',
               height: theHeight - 5,
               title: myPhotolinks[actualPhotolink].links[0].title,
               buttons: {
        	 Close: function() {
        	   $( this ).dialog( "close" );
        	 }
               }
        });
        $( "#ph-dialog-"+actualPhotolink ).dialog( "open" );
        */
    }, function(e){
        console.log('Single Click!!!');
        tagDefaultView();
        //sendPhotolink(actualPhotolink);
    },400);


    // Panel buttons
/* disabled
    $('#rgb-buttons .rbtn').on('click',function(e){
        tagDefaultView();
    });
    $('#rgb-buttons .gbtn').on('click',function(e){
        tagDefaultView();
        $('.tag').addClass('tag-flash');
    });
    $('#rgb-buttons .bbtn').on('click',function(e){
        tagDefaultView();
        $('.tag').addClass('tag-yellow');
    });
    $('#telll-button'     ).on('click',function(e){
        $( "#telllspanel" ).panel( "open");
    });
    $('#settings-button'  ).on('click',function(e){
        $( "#settingspanel" ).panel( "open");
    });
*/
    var panelSliding = 0;
    $('#return-button'  ).on('click',function(e){
             scrollPhotolinksPanel(-1);
    });
    $('#forward-button'  ).on('click',function(e){
             scrollPhotolinksPanel(1);
    });



    /** the movie player
     * TODO: make a class
     **/
    var thePlayer = {};
    projekktor('#telll-pkt', {
	volume: 0.8,
	playerFlashMP4: 'js/projekktor/swf/StrobeMediaPlayback/StrobeMediaPlayback.swf',
	playerFlashMP3: 'js/projekktor/swf/StrobeMediaPlayback/StrobeMediaPlayback.swf',
        width: $('#telll-movie').width(),
        height: $('#telll-movie').height(),
        disallowSkip: false,
        //platforms: ['browser', 'flash'],
        enableFullscreen: false,
        useYTIframeAPI: true,
        autoplay:false,
        continuous:false,
    }, function(player){
        // player listeners
        player.addListener('time', timeListener);
        player.addListener('state', stateListener);
        player.addListener('mouseenter', mouseEnterListener);
        player.addListener('touchstart', mouseEnterListener);
        player.addListener('mouseleave', mouseLeaveListener);
        player.addListener('touchend', mouseLeaveListener);
        // is youtube?
        if (isYoutube){
            console.log('Preparing Youtube movie ...');
            var ytMovie = $.queryString['v'] || "ooWWBybEKHc";
            console.log('Opening movie: '+ytMovie);
            var playlist = [
               {
                  0:{src:"http://www.youtube.com/watch?v="+ytMovie, 
                     type:"video/youtube"}
               }   
            ];
            player.setFile(playlist);
            player.setConfig( {platforms: ['flash']} );
            player.setStop();
            player.setDebug(true);
            console.log(player);
        }
        //player.setDebug(true);
        thePlayer = player;
    });
    // Video behaviors
    // show labels when mouse over
    var mouseEnterListener = function(){
          tagDefaultView(); 
    }
    // hide labels 5 seconds after mouse out
    var mouseLeaveListener = function(){
          setTimeout(function(){tagNoneView()},5000); 
    }
    // state listener callback
    var stateListener = function(state) {
    //console.log(state);
    switch(state) {
        case 'PLAYING':
        break;
        case 'PAUSED':
            $('.tag').detach();
	    for (i = 0 ; i < animT.length ; i++) { clearTimeout(animT[i]); }
            for (i = 0 ; i < trackms.length; i++){ trackms[i].stopped = 1; }
        break;
        case 'STOPPED':
            $('.tag').detach();
	    for (i = 0 ; i < animT.length ; i++) { clearTimeout(animT[i]); }
            for (i = 0 ; i < trackms.length; i++){ trackms[i].stopped = 1; }
        break;
        case 'COMPLETED':
            showClickbox();
        break;
    }
    }

    // time listener callback
    // triggered whenever playhead position changes (e.g. during playback)
    var timeListener = function(value) {
        $('#status').val( value );
        moviePosition = value;
        // scan trackms to see if someone is now
        for (i=0; i < trackms.length; i++){
            p2=trackms[i].points[0].t;
            p1=p2;
            for (j=0; j < trackms[i].points.length; j++){
                tp = trackms[i].points[j].t;
                if (tp > p2) p2 = tp;
                if (tp < p1) p1 = tp;
            }
            if ( value >= p1 && value <= p2 ) { // It's playing now!
                if (trackms[i].stopped){
                    trackms[i].stopped = 0;
                    actualPhotolink = trackms[i].photolink;
console.log('Photolink n: ');
console.log(trackms[i].photolink);
//console.log('Actual ph: ');
//console.log(actualPhotolink);
                    // scroll photolink panel to here
                    scrollPhotolinksPanel( actualPhotolink - highlightedPhotolink );
                    playTrackm(i); // animate tag
                    flashBalls();  // the warn element
               }
            } else {
                    trackms[i].stopped = 1;
            }
        }
    }

    /** projekktor toolbar change
     * align logo
    */
    $('.ppcontrols').bind('cssClassChanged', function(){
        if ($('.ppcontrols').hasClass('active')){
            //console.log('Controls active');
            $("#telll-warn").css({
                   "bottom" : '40px'
            });
        } else {
            //console.log('Controls out');
             $("#telll-warn").css({
                   "bottom" : '10px'
            });
        }
    });

    /** tagViews functions
     */
    function tagDefaultView(){
        $('.tag').removeClass('tag-none');
        $('.tag').removeClass('tag-flash');
        $('.tag').removeClass('tag-yellow');
        $('.tag').addClass('tag-default');
        $('.tag *').on('mouseover',function(){tagDefaultView()});
        $('.tag *').on('touchstart',function(){tagDefaultView()});
    }
    function tagNoneView(){
        $('.tag').removeClass('tag-default');
        $('.tag').removeClass('tag-flash');
        $('.tag').removeClass('tag-yellow');
        $('.tag').addClass('tag-none');
    }

    function showClickbox(){
        //console.log('Opening clickbox ...');
        $( "#clickbox" ).dialog({
	   modal: true,
           width: '60%',
           height: theHeight - 15,
           title: "Clickbox - Photolinks sent",
	   buttons: {
	     Close: function() {
	       $( this ).dialog( "close" );
	     }
	   }
        });
        $( "#clickbox").dialog( "open" );
    }

    /** flashBalls
    * Balls flashing with logo
    */
    function flashBalls() {
        console.log('Flashing!!!');
        $("#telll-warn").css({
               "background-image": "url('../img/logo_3l_bbg.png')",
               "background-repeat": "no-repeat",
               "cursor": "pointer",
               "opacity": "0.6",
               "background-size" : "44px 44px",
               "z-index": '10000000'
        });
        $("#telll-warn").fadeIn(800, function(){
            $("#telll-warn").css({
               "background-image": "url('../img/logo_3l_bbg.png')",
               "background-repeat": "no-repeat",
               "background-size" : "44px 44px"
            });
            // close after 5 seconds TODO: use a var
            setTimeout(function(){
                $("#telll-warn").fadeOut();
            },5000);
        });
    }


    /** Full window
    * Adjust viewport to full window
    */
    function _fullWindow(){
        $( "#telll-player-frame" ).css('position','fixed');
        $( "#telll-player-frame" ).css('top','0');
        $( "#telll-player-frame" ).css('left','0');
        $('#telll-movie').width($(window).width());
        $('#telll-movie').height($(window).height());
        $( "#telll-player-frame" ).width($('#telll-movie').width());
        $( "#telll-player-frame" ).height($('#telll-movie').height());
        $('#telll-pkt').width($('#telll-movie').width());
        $('#telll-pkt').height($('#telll-movie').height());
        theHeight = $(window).height();
    }

    /** playTrackm
     * @param index
    **/
    function playTrackm(index){
        tk = trackms[index];
        for (i=0; i<tk.points.length-1; i++){
             pt = tk.points[i];
             xpt= tk.points[i+1];
             if (pt.t < moviePosition ){
                  if (i == tk.points.length-2){
                      animTag(pt.x, pt.y, xpt.x, xpt.y, 0, xpt.t-moviePosition, tk.photolink,true);
                  } else {
                      animTag(pt.x, pt.y, xpt.x, xpt.y, 0, xpt.t-moviePosition, tk.photolink, false);
                  }
             } else {
                  if (i == tk.points.length-2){
                      animTag(pt.x, pt.y, xpt.x, xpt.y, pt.t-moviePosition, xpt.t-pt.t, tk.photolink, true);
                  } else {
                      animTag(pt.x, pt.y, xpt.x, xpt.y, pt.t-moviePosition, xpt.t-pt.t, tk.photolink, false);
                  }
             }
        }
    }

    /** animTag
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @param tout
     * @param time
     * @param plId
     * @param last
    **/
    var animT = [];
    function animTag(x1, y1, x2, y2, tout, time, plId, last){
         // using miliseconds
         tout = tout*1000;
         time = time*1000;

         vOffset = $('video').offset();
         vWidth  =  $('video').width();
         vHeight =  $('video').height()
         x1=Math.round(vWidth*x1/100+vOffset.left);
         x2=Math.round(vWidth*x2/100+vOffset.left);
         y1=Math.round(vHeight*y1/100+vOffset.top);
         y2=Math.round(vHeight*y2/100+vOffset.top);
         myPl = myPhotolinks[plId];
         handle = setTimeout (function(t){
              // Create the tag if it doesn't exist
              if( !$('#pl-'+plId).length ){
                //$("body").append('<div id="pl-'+plId+'" class="tag tag-none"><div class="clkbl"><div class="tag-label"><a target="_blank" href="'+myPl.links[0].url+'">'+myPl.links[0].title+'</a></div></div></div>');
                $("body").append('<div id="pl-'+plId+'" class="tag tag-none"><div class="clkbl"><div class="tag-label">'+myPl.links[0].title+'</div></div></div>');
                $('#pl-'+plId).css({'left':x1,'top':y1});
                $('#pl-'+plId).css({'width':'20%','height':'18%'});
                $('#pl-'+plId).fadeIn();

                // When double clicked -> Dialog with link
                //$('#pl-'+plId+' *').dblclick(function (e) {
                $('#pl-'+plId+' *').doubletap(function (e) {
        console.log('Double Click!!!');
                    thePlayer.setPause();
                    // show dialog with photolinked webpage
		    $('body').append('<div id="ph-dialog-'+plId+'"><iframe width="100%" height="100%" src="/cgi-bin/mirror.pl?url='+myPl.links[0].url+'"></div>');
		    $( "#ph-dialog-"+plId ).dialog({
		           modal: true,
                           width: '80%',
                           height: theHeight - 5,
                           title: myPl.links[0].title,
		           buttons: {
		    	 Close: function() {
		    	   $( this ).dialog( "close" );
		    	 }
		           }
		    });
                    $( "#ph-dialog-"+plId ).dialog( "open" );

		},
                // When single clicked -> Send photolink
                //$('#pl-'+plId+' *').click(
                function (e) {
        console.log('Single Click!!!');
                    sendPhotolink(plId);
		},400);

              } // Tag created. Animate it!
              $('#pl-'+plId).animate({
                    'left':x2,
                    'top':y2,
              },time,function(){
                    // done

              });
          },tout);
          // save timeout at stack
          animT.push(handle);
          // if it's the last animation fadeout after done
          handle = setTimeout (function(t){
              if(last) $('#pl-'+plId).fadeOut(200,function(){});
          },tout+time);
          animT.push(handle);
    }

    /** Send photolink to clickbox
     * @param id
    */
    function sendPhotolink (photolinkId){
        var plHtml = "";
        photolinksSent.push(myPhotolinks[photolinkId]);
        console.log(photolinksSent);
        for (i=0; i<photolinksSent.length; i++){
            plHtml += "<div class='photolink-list-element'><a href='"+photolinksSent[i].links[0].url+"'><span class='photolink-thumb'><img class='photolink-thumb-image' src='"+photolinksSent[i].thumb+"'></span><span class=photolink-title>"+photolinksSent[i].links[0].title+"</span><span class='photolink-description'>"+photolinksSent[i].links[0].description+"</span></a></div>";
        }
        console.log("Sending photolink ... "+photolinkId);
        $('#clickbox').html(plHtml);
        $("<div data-role='popup' class='telll-popup'>Photolink sent!</div>").appendTo('body');
        $( ".telll-popup" ).popup();
        $( ".telll-popup" ).popup( "open", null );
        setTimeout(function(){
            $( ".telll-popup" ).popup('close');
            $( ".telll-popup" ).detach();
        },2000);
        var saas = new tws('http://52.3.72.192:3000');
        var data = {
            'username': "mock_01",
            'password': "blablabla",
            'model':'iPad'
        };
        var xhr = saas.login(data);
        xhr.addEventListener('load', function(){
            //console.log(this.responseText);
            var jsData = JSON.parse(this.responseText);
            if (jsData.error) alert(jsData.error);
            authKey = jsData.auth_key;
            saas.setHeaders({"X-API-Key": 123, "X-Auth-Key": authKey});
	    saas.sendPhotolink('{"extradata":"blablabla"}');
        });
   }

    /**
     * createPhotolinksPanel
     * TODO: make a class
    **/
    function createPhotolinksPanel(){
	    //console.log("Creating panel ...");

	    // Fill panel with photolinks
	    photolinks = myPhotolinks;
	    //console.log(photolinks);
	    $("#panel-slider").html(""); // clean panel
	    for (i = 0; i < photolinks.length; ++i) {
	       //console.log(photolinks[i]);
	       $("#panel-slider").append('<div class="frame-icon"><img class="photolink-icon" id="icon_'+photolinks[i].id+'" src="'+photolinks[i].thumb+'" id_photolink='+photolinks[i].id+'><label for="icon_'+photolinks[i].id+'">'+photolinks[i].links[0].title+'<label></div>');
	    }
            // mouse out : labels
            $(".frame-icon *").on("mouseover",function(e){
                 var thisid=$( this ).attr('id');
                 //console.log(thisid);
                 $('label[for='+thisid+']' ).css("display","inline");
            });
            $(".frame-icon *").on("mouseleave",function(e){
                 $('label').css("display","none");
            });
            // touch : labels
            $(".frame-icon *").on("touchstart",function(e){
                 var thisid=$( this ).attr('id');
                 //console.log(thisid);
                 $('label[for='+thisid+']' ).css("display","inline");
            });
            $(".frame-icon *").on("touchend",function(e){
                 $('label').css("display","none");
            });
/*
            $(".frame-icon *").click(function() {
                sendPhotolink($(this).attr('id_photolink'));
            });
            //$('.frame-icon *').dblclick(function (e) {
*/
            $('.frame-icon *').doubletap( function (e) {
                console.log('Double Click!!!');
                thePlayer.setPause();
                var ap = parseInt($(e.srcElement).attr('id_photolink'));
                // show dialog with photolinked webpage
                $('body').append('<div id="ph-dialog-'+ap+'"><iframe width="100%" height="100%" src="js/projekktor/themes/maccaco/buffering.gif"/></div>');
                //path = '/cgi-bin/mirror.pl?url='+myPhotolinks[ap].links[0].url;
                path = myPhotolinks[ap].links[0].url;
                $( "#ph-dialog-"+ap+" iframe" ).attr('src', path);
                $( "#ph-dialog-"+ap ).dialog({
                       modal: true,
                       width: '80%',
                       height: theHeight - 5,
                       title: myPhotolinks[ap].links[0].title,
                       buttons: {
                	 "See in the movie": function() {
                           var position = trackms[ap].points[0].t;
                	   $( this ).dialog( "close" );
                           thePlayer.setPlay();
                           setTimeout(function(){
                           thePlayer.setPlayhead(Number(position.toString()));
                           actualPhotolink = ap;
                           },500);
                           $("<div data-role='popup' class='telll-popup'>Searching tag on movie ...</div>").appendTo('body');
                           $( ".telll-popup" ).popup();
                           $( ".telll-popup" ).popup( "open", null );
                           setTimeout(function(){
                               $( ".telll-popup" ).popup('close');
                               $( ".telll-popup" ).detach();
                           },2000);

                	 }
                       }
                });
                $( "#ph-dialog-"+ap ).dialog( "open" );
            }, function(e){
              console.log('Single Click!!!');
              var ap = parseInt($(e.srcElement).attr('id_photolink'));
              console.log('Sendind Photolink ');
              console.log(this);
              sendPhotolink(ap);
            },400);
            //highlightPhotolink(0);
    }
    function scrollPhotolinksPanel(n){
            console.log("Scrolled by:");
            console.log(n);
            highlightedPhotolink += n;
            //console.log("Highlighted Photolink:");
            //console.log(highlightedPhotolink);
	    pls = $("#panel").find('.frame-icon img');
            //console.log(pls);
            // Catching some errors
            if (highlightedPhotolink > pls.length-1){
                highlightedPhotolink = parseInt(pls.length)-1;
            }
            if (highlightedPhotolink < 0){
                highlightedPhotolink = 0; 
            }
            
            highlightPhotolink(highlightedPhotolink);

            // Scroll panel to position
            // claculate offset
            var ml = 0;
            pls.each(function(i){
                if (parseInt(pls.eq(i).attr('id_photolink')) < highlightedPhotolink - Math.round(phListSize/2) 
                //   && highlightedPhotolink < parseInt(pls.length) - Math.round(phListSize/2)
                ){
                    ml ++; 
                }
            });
            var of = ml * phListElementWidth * -1;
            $('#panel-slider').animate({
                 'margin-left' : of+"px" 
            }, 400, function(){
	        //pls.eq(0).insertAfter(pls.eq(pls.length-1));
	        //pls.eq(0).css('margin-left',ml);
                //panelSliding = 0;
                console.log('Panel scrolled by: '+of);
            });

            /*
            if (highlightedPhotolink == 0){ highlightPhotolink(0); panelSliding = 0;return 0; }
            if (highlightedPhotolink == 1){ highlightPhotolink(1); panelSliding = 0;return 0; }
            if (highlightedPhotolink == 2){ highlightPhotolink(2); panelSliding = 0;return 0; }
            if (highlightedPhotolink == 3 && n === 1){ highlightPhotolink(3); panelSliding = 0;return 0; }
            if (highlightedPhotolink == pls.length-1){
                    highlightPhotolink(6); panelSliding = 0;return 0; }
            if (highlightedPhotolink == pls.length-2 ){
                    highlightPhotolink(5); panelSliding = 0;return 0; }
            if (highlightedPhotolink == pls.length-3){
                    highlightPhotolink(4); panelSliding = 0;return 0; }
            if (highlightedPhotolink == pls.length-4 && n === -1){
                    highlightPhotolink(3); panelSliding = 0;return 0; }
            ml = pls.css('margin-left');
            mwidth = '-120px';
            if (n === -1){
	        pls.eq(pls.length-1).insertBefore(pls.eq(0));
	        pls.eq(pls.length-1).css('margin-left',mwidth);
                pls.eq(pls.length-1).animate({
                            'margin-left': ml,
                            'transparency' : 0
                       }, 400, function(){
                           //panelSliding = 0;
                });
	    } else if (n === 1){
                pls.eq(0).animate({
                        'margin-left': mwidth,
                        'transparency' : 0
                   }, 400, function(){
	               pls.eq(0).insertAfter(pls.eq(pls.length-1));
	               pls.eq(0).css('margin-left',ml);
                       //panelSliding = 0;
                });
	    } else if (Math.abs(n) > 1) {
                for (i=0; i<Math.abs(n) ; i++){
                    setTimeout(function(){
                        scrollPhotolinksPanel(n/Math.abs(n));
                    },(i+1)*451);
                }
            }
            // done
           // restore photolinks
           setTimeout(function(){
               highlightPhotolink(3); panelSliding = 0;
           },450);
           */
    }
    function highlightPhotolink(n){
        pls = $("#panel").find('.frame-icon img');
        console.log('---> '+n);
        console.log(pls.eq(n));
        pls.each(function(i){
            //console.log(pls.eq(i).attr('id_photolink'));
            //newSrc = pls.eq(i).find('img').attr('src').replace("_green.jpg", ".jpg");
            //pls.eq(i).find('img').attr('src', newSrc);
            if (parseInt(pls.eq(i).attr('id_photolink')) != n ){
                pls.eq(i).css('opacity', '0.3');
            } else {
                pls.eq(n).css('opacity', '1');
                console.log('highlighting '+n);
            }
        });
        // highlight actual photolink
        //newSrc = pls.eq(n).find('img').attr('src').replace(".jpg", "_green.jpg");
        //pls.eq(n).find('img').attr('src', newSrc);
        //pls.eq(n).css({'width':'96px','height':'52px'});
    }

    _fullWindow();
});
