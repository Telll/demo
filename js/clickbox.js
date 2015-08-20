jQuery.noConflict();
var theHeight;

jQuery( document ).ready(function( $ ) {

    $( window ).resize(function() {
        _fullWindow();
    });

    //Intsntiate a photolinks
    //photolink = new Photolink($('#telll-photolink'));
    photolink = createPhotolink($('#telll-photolink'));

    // inject navbar on control top
    $('#telll-top-controls').append($('#mainnav'));
    $('#mainnav').attr('id', 'telll-nav');
    //$('#telll-top-controls').append($('#mainnav-mobi'));
    // top links
    $('#menu-item-0').on('click', function(e){window.location.href='/';e.preventDefault();});
    //$('#menu-item-1').on('click', function(e){window.location.href='/dashboard';e.preventDefault();});
    $('#menu-item-2').on('click', function(e){window.location.href='/clickbox.html';e.preventDefault();});
    $('#menu-item-3').on('click', function(e){window.location.href='/player.html';e.preventDefault();});
    // screen behaviors:
    // on mouseup show controls
    topOpen = 0;
    $( document ).on( "mousemove", function( event ) {
         if (event.pageY < 60 && topOpen == 0){
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

    botOpen = 0;
    $( document ).on( "mousemove", function( event ) {
         if (event.pageY > (theHeight - 60) && botOpen == 0){
             $('#telll-bottom-controls').slideDown();
             setTimeout(function(){botOpen = 1;},600);
         }
    });
    $('#telll-bottom-controls').on("mouseleave" , function(event){
         if (botOpen == 1){
             $('#telll-bottom-controls').slideUp();
             setTimeout(function(){botOpen = 0;},600);
         }
    });



    $('#telll-photolink').mouseover(function() {
         //$('#telll-bottom-controls').slideToggle();
    });




   _fullWindow();

    ///////////////////////////////////////////////////////

    /** createPhotolink
     * @param j : the photolink dom obj
     */
    function createPhotolink (j){
        var phData;
	var lp = new LongPolling("GET", "http://52.3.72.192:3000/app/photolink/lp", "\n//----------//", {"X-Api-Key": 123, "X-Auth-Key": "395fb7b657db2fb5656f34de3840e73c90b79c31"});
        console.log('Creating photolink ...');
        //console.log(j);
        //console.log(lp);
        lp.create();
	lp.onData = function(data) {
            phData = data;
            jsData = JSON.parse(phData);
	    console.log('got!');
	    //console.log(jsData);
            //console.log(myPhotolinks);
            plId = jsData.id;
            myPl = {};
            for(i=0; i<myPhotolinks.length;i++){
                //console.log(plId);
                //console.log(myPhotolinks[i].id);
                if(myPhotolinks[i].id == plId) myPl = myPhotolinks[i];
            }
            console.log(myPl.thumb.replace('_180x90',''));
	    //j.replaceWith('<div id="telll-photolink"><img id="photolink-image" src="'+jsData.media.image+'"></div>');
	    j.on('click', function(){window.location.href=myPl.links[0].url;});
	    j.css('background-image','url('+myPl.thumb.replace('_180x90','')+')');
	};

	    //$('#photolink-image').on('click', function(){console.log('Clicked! Implement me, please!');});
        lp.connect();
        return phData;

        //tws = new Tws;
        //pl = tws.getPhotolink(function(){
        //    j.replaceWith('<div id="telll-photolink"><img id="photolink-image" src="'+pl.image+'"></div>');
        //$('#photolink-image').on('click', function(){});
        //});
    }

    /** Full window
    * Adjust viewport to full window
    */
    function _fullWindow(){
        $('#telll-photolink').width($(window).width());
        $('#telll-photolink').height($(window).height());
        $( "#telll-clickbox-frame" ).width($('#telll-photolink').width());
        $( "#telll-clickbox-frame" ).height($('#telll-photolink').height());
        $( "#telll-clickbox-frame" ).height($('#telll-photolink').height());
        $( "#telll-clickbox-frame" ).css('position','fixed');
        $( "#telll-clickbox-frame" ).css('top','0');
        $( "#telll-clickbox-frame" ).css('left','0');
        theHeight = $(window).height();
    }
 });
