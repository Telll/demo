/* clickbox.js
 * require telll.js Version 0.15
 */
var theHeight;
var authKey;
var deviceModel='iPad';
var devicePhotolinks=[];
var user;

jQuery.noConflict();
jQuery( document ).ready(function( $ ) {

    $( window ).resize(function() {
        _fullWindow();
    });

    //Intsntiate a photolinks
    //photolink = new Photolink($('#telll-photolink'));
    photolink = createPhotolink($('#telll-photolink'));
    //updatePhotolinksList();
    // inject navbar on control top
    //$('#telll-top-controls').append($('#mainnav'));
    //$('#mainnav').attr('id', 'telll-nav');
    //$('#telll-top-controls').append($('#mainnav-mobi'));
    // top links
    //$('#menu-item-0').on('click', function(e){window.location.href='/';e.preventDefault();});
    //$('#menu-item-1').on('click', function(e){window.location.href='/dashboard';e.preventDefault();});
    //$('#menu-item-2').on('click', function(e){window.location.href='/clickbox.html';e.preventDefault();});
    //$('#menu-item-3').on('click', function(e){window.location.href='/player.html';e.preventDefault();});
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
             setTimeout(function(){$('#telll-top-controls').slideUp()},5000);
             setTimeout(function(){topOpen = 0;},5600);
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
             
             setTimeout(function(){$('#telll-bottom-controls').slideUp();},5000);
             setTimeout(function(){botOpen = 0;},5600);
         }
    });



    $('#telll-photolink').mouseover(function() {
         //$('#telll-bottom-controls').slideToggle();
    });

    $('#photolink-image a').attr('href', myPhotolinks[0].links[0].url);
    $('#photolink-image').on('click', function(){
        console.log('Opening '+ myPhotolinks[0].links[0].url);
//        $(this).attr('href', myPhotolinks[0].links[0].url);
        //window.location.href=myPl.links[0].url;
//        window.open(  myPhotolinks[0].links[0].url, 
//        "popupWindow", 
//        "width=600,height=600,scrollbars=yes");
//        return false;
    });



   _fullWindow();

    ///////////////////////////////////////////////////////

    /** createPhotolink
     * @param j : the photolink dom obj
     */
    function createPhotolink (j){
        var saas = new tws('52.3.72.192:3000');
        
        var data = {
            'username': "mock_01",
            'password': "blablabla",
            'model':'iPad'
        };
        //user = new User(data);
        var xhr = saas.login(data);
        xhr.addEventListener('load', function(){
            console.log('Geting photolink ... lp?');
            var jsData = JSON.parse(this.responseText);
            if (jsData.error) alert(jsData.error);
            saas.setHeaders({"X-API-Key": 123, "X-Auth-Key": jsData.auth_key});
	    var phData = "{'error':'unknown'}";
	    saas.getPhotolink(phData, function(e,d){
                 console.log('Got!');
                 if (e) alert (e);
                updatePhotolinksList(d.photolink);
            });
/*
	    lp.onData = function(data) {
	        phData = data;
	        jsData = JSON.parse(phData);
	        console.log('got!');
	        console.log(jsData);
                console.log(myPhotolinks);
                plId = jsData.id;
                myPl = {};
                for(i=0; i<myPhotolinks.length;i++){
                    console.log(plId);
                    console.log(myPhotolinks[i].id);
                    if(myPhotolinks[i].id == plId) myPl = myPhotolinks[i];
                }
                console.log(myPl.thumb.replace('_180x90',''));
                $('#photolink-image a').attr('href', myPl.links[0].url);
	        $('#photolink-image').css('background-image','url('+myPl.thumb.replace('_180x90','')+')');
                console.log(j);
                $('#photolink-image').fadeIn();
                $('#photolink-list').fadeOut();
                updatePhotolinksList(myPl);
                // return to list view in 15 seconds
                setTimeout(function(){
                    $('#photolink-image').fadeOut();
                    $('#photolink-list').fadeIn();
                },15000);
	    };
	lp.connect();
*/
        });
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

    /** showPhotolinkImag
     */
    function showPhotolinkImage (myPl){
        console.log('Show photolink ...');
        console.log (myPl);
        $('#photolink-image img').attr('src', myPl.thumb);
        $('#photolink-image').fadeIn(); 
        setTimeout(function(){
            $('#photolink-image').fadeOut(); 
        }, 4000);
    }
    /** updatePhotolinksList
     *
     */
    function updatePhotolinksList(myPl) {
        var myList = "";
        var phmap = [];
        console.log('Updating photolinks list ...');
        devicePhotolinks.push(myPl);
        console.log(devicePhotolinks);
        showPhotolinkImage(myPl);
        for(i=0; i<devicePhotolinks.length;i++){
            myPl = myPhotolinks[i];
            //myPl = devicePhotolinks[i];
            console.log("Photolink "+i );
            console.log(myPl);
            myList += '<div class="photolink-list-element"><a target="_blank" href="'+myPl.links[0].url+'"><div class="ple-img"><img src="'+myPl.thumb+'"></div><div class="ple-info"><span class="ple-title">'+myPl.links[0].title+'</span><br><span class="ple-desc">'+myPl.links[0].description+'</span></div></a></div>';
            console.log(myList);
        }
        $('#clickbox-empty').detach();
        $('#photolinks-list *').detach();
        $('#photolinks-list').html(myList);
    }
 });
