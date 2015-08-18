
jQuery.noConflict();

var theHeight;
var moviePosition;

jQuery( document ).ready(function( $ ) {
    var tws      = new Tws();
    var myMovies     = tws.getMovies('featured');
    var myMovie      = tws.getMovie('000');
    //var myPhotolinks = tws.getPhotolinks(myMovie.id);
    var myTrackms    = tws.getTrackms(myMovie.id);
    moviePosition = 0;

    // mantain the full window viewport
    _fullWindow();
    flashBalls();
    $( window ).resize(function() {
        _fullWindow();
    });

    /** Create top control
    */
    // inject navbar on control top
    $('#telll-top-controls').append($('#mainnav'));
    $('#mainnav').css('margin-top','3px');

    // on mouseup show controls
    topOpen = 0;
    $( document ).on( "mousemove", function( event ) {
         if (event.pageY < 20 && topOpen == 0){
             $('#telll-top-controls').slideDown();
             setTimeout(function(){topOpen = 1;},600);
         }
    });
    $('#telll-top-controls').on("mouseleave" , function(event){
         if (topOpen == 1){
             $('#telll-top-controls').slideUp();
             setTimeout(function(){topOpen = 0;},600);
         }
    });

    /** Create panel controls
     */
    panelOpen = 0;
    $( document ).on( "mousemove", function( event ) {
         if (event.pageY > (theHeight - 40) && panelOpen == 0){
             $('#telll-controls').slideDown();
             //$('#telll-pkt').animate({height:"-=50"},600);
             panelOpen = 1;
         }
    });
    $( document ).on( "mousemove", function( event ) {
         if (event.pageY < (theHeight - 110) && panelOpen == 1){
             $('#telll-controls').slideUp();
             //$('#telll-pkt').animate({height:"+=50"},600);
             panelOpen = 0;
         }
    });

    createPhotolinksPanel();

    //$('#settings-button').attr('href','#settingspanel'); 
    // Panel buttons
    $('#rgb-buttons .rbtn').on('click',function(e){ });
    $('#rgb-buttons .gbtn').on('click',function(e){ });
    $('#rgb-buttons .bbtn').on('click',function(e){ });
    $('#telll-button'     ).on('click',function(e){
        $( "#telllspanel" ).panel( "open");
    });
    $('#settings-button'  ).on('click',function(e){
        $( "#settingspanel" ).panel( "open");
    });

    var panelSliding = 0;
    $('#return-button'  ).on('click',function(e){
         if (panelSliding == 0){
             panelSliding = 1;
             scrollPhotolinksPanel(-1);
         }
    });
    $('#forward-button'  ).on('click',function(e){
          if (panelSliding == 0){
             panelSliding = 1;
             scrollPhotolinksPanel(1);
         }
    });


    // mouse out : labels
    $(".photolink-icon").on("mouseover",function(e){
         var thisid=$( this ).attr('id');
         //console.log(thisid);
         $('label[for='+thisid+']' ).css("display","inline");
    });
    $(".photolink-icon").on("mouseleave",function(e){
         $('label').css("display","none");
    });

    $("#panel img").click(function() {
        sendPhotolink($(this).attr('id_photolink'));
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
    }, function(player){
        // player listeners
        player.addListener('time', timeListener);
        player.addListener('state', stateListener);
        thePlayer = player;
    });

    // state listener callback
    var stateListener = function(state) {
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
                    playTrackm(i);
                }
            } else {
                    trackms[i].stopped = 1;
            }
        }
    }


    /** flashBalls
    * Balls flashing with logo
    */
    function flashBalls() {
        console.log('Flashing!!!');
        $("#telll-warn").fadeIn(function(){
        //$("#telll-warn").css({'background-image': url('../img/flash_balls.gif')});
        setTimeout(function(){
        $("#telll-warn").fadeOut();
        },1500);
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
                $("body").append('<div id="pl-'+plId+'" class="tag"><div class="clkbl"><div class="tag-label"><a target="_blank" href="'+myPl.links[0].url+'">'+myPl.links[0].title+'</a></div></div></div>');
                $('#pl-'+plId).css({'left':x1,'top':y1});
                $('#pl-'+plId).css({'width':'20%','height':'18%'});
                $('#pl-'+plId).fadeIn();

                // When double clicked
                // Dialog with link
                // When single clicked
                // Send photolink
                $('#pl-'+plId+' *').click(function (e) {
		var $this = $(this);
                e.preventDefault();
		if ($this.hasClass('clicked')){
		    $this.removeClass('clicked');
		    console.log("Double click");

	            // pause the movie
                    thePlayer.setPause();

                    // show dialog
 	            //$('body').append('<div id="ph-dialog-'+plId+'"><iframe src="'+myPl.links[0].url+'"</div>');
		    $('body').append('<div id="ph-dialog-'+plId+'"><iframe width="100%" height="100%" src="/"</div>');
		    $( "#ph-dialog-"+plId ).dialog({
		       modal: true,
                       width: '80%',
                       title: myPl.links[0].title,
		       buttons: {
			 Ok: function() {
			   $( this ).dialog( "close" );
			 }
		       }
		    });
                    $( "#ph-dialog-"+plId ).dialog( "open" );

		}else{
		     $this.addClass('clicked');
		     setTimeout(function() {
			 if ($this.hasClass('clicked')){
			     $this.removeClass('clicked');
			     console.log("Just one click!");
                             sendPhotolink(plId);
			 }
		     }, 500);
		}
		});

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
        console.log("Sending photolink ...");
        //$.post( "ajax/test.html", function( data ) {
             console.log("Sent!");
        //});
        //player.api('seekTo', my_frame);
   }

    /**
     * createPhotolinksPanel
    **/
    function createPhotolinksPanel(){
	    //console.log("Creating panel ...");

	    // Fill panel with photolinks
	    photolinks = myPhotolinks;
	    //console.log(photolinks);
	    $("#panel").html(""); // clean it
	    for (i = 0; i < photolinks.length; ++i) {
	       //console.log(photolinks[i]);
	       $("#panel").append('<div class="frame-icon"><img class="photolink-icon" id="icon_'+photolinks[i].id+'" src="'+photolinks[i].thumb+'" id_photolink='+photolinks[i].id+'><label for="icon_'+photolinks[i].id+'">'+photolinks[i].links[0].title+'<label></div>');
	    }
            highlightPhotolink(0);
    }
    var actualPhotolink = 0;
    function scrollPhotolinksPanel(n){
            actualPhotolink += n;
	    pls = $("#panel").find('.frame-icon');
            if (actualPhotolink > pls.length-1){actualPhotolink = pls.length-1}
            if (actualPhotolink < 0){actualPhotolink = 0; panelSliding = 0;return 0;}
            //console.log(actualPhotolink);
            if (actualPhotolink == 0){ highlightPhotolink(0); panelSliding = 0;return 0; }
            if (actualPhotolink == 1){ highlightPhotolink(1); panelSliding = 0;return 0; }
            if (actualPhotolink == 2){ highlightPhotolink(2); panelSliding = 0;return 0; }
            if (actualPhotolink == 3 && n === 1){ highlightPhotolink(3); panelSliding = 0;return 0; }
            if (actualPhotolink == pls.length-1){
                    highlightPhotolink(6); panelSliding = 0;return 0; }
            if (actualPhotolink == pls.length-2 ){
                    highlightPhotolink(5); panelSliding = 0;return 0; }
            if (actualPhotolink == pls.length-3){
                    highlightPhotolink(4); panelSliding = 0;return 0; }
            if (actualPhotolink == pls.length-4 && n === -1){
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
	    }
            // done
           // restore photolinks
           setTimeout(function(){
               highlightPhotolink(3); panelSliding = 0;
           },450);
    }

    function highlightPhotolink(n){
        //console.log('highlighting '+n);
        pls = $("#panel").find('.frame-icon');
        //console.log(pls.eq(n));
        pls.each(function(i){
            newSrc = pls.eq(i).find('img').attr('src').replace("_green.jpg", ".jpg");
            pls.eq(i).find('img').attr('src', newSrc);
        });
        // highlight actual photolink
        newSrc = pls.eq(n).find('img').attr('src').replace(".jpg", "_green.jpg");
        pls.eq(n).find('img').attr('src', newSrc);
    }

    _fullWindow();
});
