/*
 * Copyright Amadeus
 */
(function() {
    // this file includes the framework scripts
    // arguments are taken from the script url

    var scripts=document.getElementsByTagName("script");
    var sz=scripts.length;
    var version='', path='', skin='', isDebug=false;
    for (var i=0;sz>i;i++) {
        var src=scripts[i].getAttribute("src");
        if (src.match(/fwk.js\?(.*)$/i)) {
            var args=''+RegExp.$1;

            // get framework version
            if (args.match(/version=([\w\-\.]+)/i)) {
                version=''+RegExp.$1;
            }

            if (args.match(/debug=true/i)) {
                isDebug=true;
            }

            if (args.match(/skin=([\w\-]+)/i)) {
                skin=''+RegExp.$1;
            }

            // get root path
            path=src.replace(/fwk.js\?.*$/i,'../..');
            path=path.replace(/([^\/\.]+\/\.\.\/)/gi,'').replace(/(\/[^\/\.]+\/\.\.)/gi,'');
            break;
        }
    }

    Aria = {
        rootFolderPath : path + "\/"
    };

    if (version=='') {
        //error
        alert('Aria Templates version number not found in fwk.js script arguments\nPlease check');
        return;
    }

    // include scripts through document.write

    if (isDebug || document.location.href.indexOf("debug=true") != -1) {
        document.write('<script type="text/javascript">');
        document.write('var Aria={debug:true};');
        document.write('</script>');
    }

    var devFiles = document.location.href.indexOf("dev=true") != -1;
    if (devFiles) {
        document.write('<script type="text/javascript" src="'+path+'/dev/aria/aria-templates-' + version);
        document.write('.js"></script>');
        Aria.rootFolderPath = path + "/dev/";
        document.write('<script type="text/javascript">Aria.rootFolderPath = "'+path+'/";aria.core.DownloadMgr.updateRootMap({"aria": {"*" : "'+path+'/dev/"}});</script>');
    } else {
        document.write('<script type="text/javascript" src="'+path+'/aria/aria-templates-' + version);
        document.write('.js"></script>');
    }

    document.write('<script type="text/javascript" src="'+path+'/css/' + skin + '-' + version);
    document.write('.js"></script>');

}());

