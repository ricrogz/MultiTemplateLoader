var templateBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].
                 getService(Components.interfaces.nsIStringBundleService);
var templateBundle = templateBundleService.createBundle("chrome://templateloader/locale/templateloader.properties");

var tempLoadPrefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

var extraurl;
var gTemplateCharset;
var gETL_body;
var gETL_currentIdentity;
var gETL_editor;
var gETL_origHTML;

function openTemplateDialog() {
	var identity = getCurrentIdentity();
	openDialog("chrome://templateloader/content/templateOptions.xul", "", "chrome,modal", identity);
}

function PreLoadTemplate() {
	//document.getElementById("cmd_loadTemplate").removeAttribute("disabled");
	gETL_currentIdentity = null;
	gETL_body = null;
	gETL_editor = null;
	gTemplateCharset = null;
	extraurl = null;
	gETL_origHTML = null;

	if (typeof gMsgCompose != "object" || ! gMsgCompose)
		return;
	var recycled = gMsgCompose.recycledWindow;
	var type = gMsgCompose.type;
	var timeout = tempLoadPrefs.getIntPref("extensions.multitemplateloader.load.delay");

	try {
		// If the message is not in HTML format, exit
		if (! gMsgCompose.composeHTML )
			return;
		// Read the template prefs for the current identity
		gETL_currentIdentity = getCurrentIdentity();
		var temp = tempLoadPrefs.getBoolPref("extensions.multitemplateloader.load.normal");
		var extra = tempLoadPrefs.getIntPref("extensions.multitemplateloader.load.extra");
		if (tempLoadPrefs.getPrefType("extensions.multitemplateloader."+gETL_currentIdentity.key+".enable") != 0)
			var enableTemplate = tempLoadPrefs.getBoolPref("extensions.multitemplateloader."+gETL_currentIdentity.key+".enable");
		else
			var enableTemplate = false;

		var enableReplyTemplate = false;
		if (enableTemplate && tempLoadPrefs.getPrefType("extensions.multitemplateloader."+gETL_currentIdentity.key+".enable_reply_forward") != 0)
			enableReplyTemplate = tempLoadPrefs.getBoolPref("extensions.multitemplateloader."+gETL_currentIdentity.key+".enable_reply_forward");

		// Disable the template load just for once
		if (temp) {
			enableTemplate = false;
			tempLoadPrefs.setBoolPref("extensions.multitemplateloader.load.normal", false);
		}
		// Force to load a different template, with the variable extraurl
		// The extra variable contains a index that is > 0 if the user has chosen
		// an extra template from the dropdown menu under compose button
		// In this case the extra variable contains the number of the template to load.
		else if (extra > 0) {
			enableTemplate = true;
			extraurl = tempLoadPrefs.getCharPref("extensions.multitemplateloader.extra.file"+extra);
			tempLoadPrefs.setIntPref("extensions.multitemplateloader.load.extra", 0);
		}

		// Call the funcion that loads the template for new messages
		if (enableTemplate && (type == 0 || type == 11))
			window.setTimeout(LoadTemplate, 500, null, true);
		// Call the funcion that loads the template for reply and forward
		else if (type == 1 || type == 2 || type == 6 || type == 3 || type == 4 || type == 7 || type == 8) {
			if (enableReplyTemplate)
				window.setTimeout(LoadTemplate, timeout, true, false);
			else
				window.setTimeout(ETLstoreHTML, timeout);
		}
		// Otherwise delete all the body styles and exit (not if it's a draft or template mail)
		else if ( ! enableTemplate || ((type != 9 && type != 10) && ! enableReplyTemplate) )
			ETLdeleteStyle();
	}
	catch(e) {}
}


function ETLdeleteStyle() {
	// Without try&catch we can get a segfault
	try {
		var editor = GetCurrentEditor();
		var bodyElement = editor.document.body;
		var bgColor =  tempLoadPrefs.getCharPref("msgcompose.background_color");
		bodyElement.removeAttribute("style");
		bodyElement.removeAttribute("background");
		bodyElement.setAttribute("bgcolor", bgColor);
		onBackgroundColorChange();
		onFontColorChange();
	}
	catch(e) {}
}

function LoadDataFromFile(FilePath) {
	// Open the file with the template and copy its content in "data" variable
	var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	try {
		file.initWithPath(FilePath);
		if (! file.exists())
			return false;
		var data = "";
		var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                        .createInstance(Components.interfaces.nsIFileInputStream);
		fstream.init(file, 1, 0, false);
		// First, read just the first 500 chars, to know what is the charset (if it's definied)
		var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"]
                       .createInstance(Components.interfaces.nsIScriptableInputStream);
		sstream.init(fstream);
		var string = sstream.read(500);
		var charsetPos = string.indexOf("charset");
		if (charsetPos > -1) {
			string = string.substring(charsetPos+8);
			var quotePos = string.indexOf('"');
			gTemplateCharset = string.substring(0, quotePos);
		}
		else
			gTemplateCharset = null;
		sstream.close();
		fstream.close();
		// Reopen the stream using the charset, if it exists
		fstream.init(file, 1, 0, false);
		const replacementChar = 	Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;
		var is = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
                   .createInstance(Components.interfaces.nsIConverterInputStream);
		is.init(fstream, gTemplateCharset , 1024, replacementChar);
		var str = {};
		while (is.readString(4096, str) != 0)
			 data += str.value;
		is.close();
		fstream.close();
		return data;
	}
	catch(e) {
		alert(templateBundle.GetStringFromName("errorInitFile"));
		return false;
	}
}

function ETLlistener() {}

ETLlistener.prototype = {
	onStartRequest: function (aRequest, aContext) {
		    this.mData = "";
	},

	onDataAvailable: function (aRequest, aContext, aStream, aSourceOffset, aLength) {
		var scriptableInputStream =  Components.classes["@mozilla.org/scriptableinputstream;1"]
			.createInstance(Components.interfaces.nsIScriptableInputStream);
		var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
         		 .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		scriptableInputStream.init(aStream);
		// Since it's impossible to know the charset before opening the stream, it is forced
		// to UTF8, even if the template has other encoding
		converter.charset = "UTF-8";
		gTemplateCharset = "UTF-8";
		var data = scriptableInputStream.read(aLength);
		try {
			var str = converter.ConvertToUnicode(data);
			this.mData += str;
		}
		catch(e) {
			this.mData += data;
		}
	},

	onStopRequest: function (aRequest, aContext, aStatus) {
		if (Components.isSuccessCode(aStatus))
			LoadTemplateIntoEditor(this.templateReply, this.templatePath, this.mData, this.manually_or_new)
		else
			alert(templateBundle.GetStringFromName("errorInitFile"));
	},

	QueryInterface : function(aIID) {
		if (aIID.equals(Components.interfaces.nsISupports) ||
	        aIID.equals(Components.interfaces.nsIInterfaceRequestor) ||
	        aIID.equals(Components.interfaces.nsIChannelEventSink) ||
	        aIID.equals(Components.interfaces.nsIProgressEventSink) ||
	        aIID.equals(Components.interfaces.nsIHttpEventSink) ||
	        aIID.equals(Components.interfaces.nsIStreamListener))
	      return this;

	    throw Components.results.NS_NOINTERFACE;
	}
};

function LoadDataFromUrl(templatePath,templateReply,manually_or_new) {
	var Ci = Components.interfaces;
	var channel = Components.classes["@mozilla.org/network/io-service;1"]
		.createInstance(Components.interfaces.nsIIOService)
		.newChannel2(
			templatePath,
			null,
			null,
			null,
			Services.scriptSecurityManager.getSystemPrincipal(),
            null,
            Ci.nsILoadInfo.SEC_NORMAL,
            Ci.nsIContentPolicy.TYPE_OTHER
        );
	var listener = new ETLlistener();
	listener.templatePath = templatePath;
	listener.templateReply = templateReply;
	listener.manually_or_new = manually_or_new;
	channel.asyncOpen(listener, null);
}

function ETLstoreHTML() {
	if (! gETL_origHTML && gETL_editor)
		gETL_origHTML = gETL_editor.document.body.textContent;
}

function LoadTemplate(templateReply,manually_or_new) {
	gETL_editor = GetCurrentEditor();

	try {
		while(gETL_editor.document.getElementById("quoteDIV"))
			gETL_editor.document.getElementById("quoteDIV").removeAttribute("id");
	}
	catch(e) {}

	ETLstoreHTML();

	if (! manually_or_new &&
		gETL_editor &&
		gETL_editor.document.getElementsByTagName("blockquote")[1] &&
		templateReply &&
		tempLoadPrefs.getPrefType("extensions.multitemplateloader."+gETL_currentIdentity.key+".disable_reply_recursive") > 0 &&
		tempLoadPrefs.getBoolPref("extensions.multitemplateloader."+gETL_currentIdentity.key+".disable_reply_recursive")
	)
		return;


	// If extraurl is null, we must load the predefinied template, otherwise the template indicated in extraurl
	if (extraurl == null) {
		// Get the prefs for current identity
		if ( tempLoadPrefs.getPrefType("extensions.multitemplateloader."+gETL_currentIdentity.key+".file") != 0)
			var templatePath = tempLoadPrefs.getCharPref("extensions.multitemplateloader."+gETL_currentIdentity.key+".file");
		else
			var templatePath = "";
	}
	else {
		var templatePath = extraurl;
	}
	if (templatePath == "")
		return;
	var data = "";
	if(templatePath.indexOf("http") == 0 || templatePath.indexOf("ftp") == 0)
		data = LoadDataFromUrl(templatePath,templateReply,manually_or_new);
	else {
		data = LoadDataFromFile(templatePath);
		if (data)
			LoadTemplateIntoEditor(templateReply, templatePath, data,manually_or_new)
	}
}

function LoadTemplateIntoEditor(templateReply, templatePath, data, manually_or_new) {
	// If it's not a regular html file, the function stops
	var checkHTML =  tempLoadPrefs.getBoolPref("extensions.multitemplateloader.load.checkHTML");
	if ( checkHTML && data.toUpperCase().indexOf("<!DOCTYPE") !=0 && data.toUpperCase().indexOf("<HTML") !=0) {
		ETLdeleteStyle();
		alert(templateBundle.GetStringFromName("badTemplate"));
		return;
	}
	// If there is not the tag with id=quoteDIV , the template can't be used to reply or forward, so exit
	if (data.indexOf("quoteDIV") == -1 && templateReply) {
		ETLdeleteStyle();
		alert(templateBundle.GetStringFromName("badTemplateReply"));
		return;
	}
	if (gETL_editor) {
		if (manually_or_new && tempLoadPrefs.getBoolPref("extensions.multitemplateloader.load_warning") && ETLisContentChanged()) {
			var q = confirm(templateBundle.GetStringFromName("loadWarning"));
			if (!q) return;
		}

		gETL_body = gETL_editor.document.body;
		// Copy the original body innerHTML in a variable
		// Must be unescaped, otherwise we loose some path corrispondeces
		var bodyHTML = unescape(gETL_body.textContent);
		// Load the template into the editor
		data = correctBodyBackgroundAttr(data,templatePath);
		if (gTemplateCharset && ! tempLoadPrefs.getBoolPref("extensions.multitemplateloader.charset.ignore"))
			SetDocumentCharacterSet(gTemplateCharset);
		try {
			UpdateMailEditCharset();
		}
		catch(e) {}

		var signature = null;
		// Signature can be inside a DIV or PRE tag
		var divs = gETL_body.getElementsByTagName("div");
		var pres = gETL_body.getElementsByTagName("pre");
		if (divs.length > pres.length)
			var len = divs.length;
		else
			var len = pres.length;
		for (var y=0;y<len;y++) {
			if (divs[y] && divs[y].getAttribute("class") == "moz-signature") {
				signature = divs[y];
				break;
			}
			else if (pres[y] && pres[y].getAttribute("class") == "moz-signature") {
				signature = pres[y];
				break;
			}
		}

		var HTMLeditor = gETL_editor.QueryInterface(Components.interfaces.nsIHTMLEditor);
		HTMLeditor.rebuildDocumentFromSource(data);

		var subDiv = gETL_editor.document.getElementById("subjectDIV");
		if (subDiv) {
			if (! document.getElementById("msgSubject").value)
				document.getElementById("msgSubject").value = subDiv.textContent;
			subDiv.parentNode.removeChild(subDiv);
		}

		// If it's necessary (for reply and forward) replace the node with id=quoteDIV with
		// the new div element, with the original body innerHTML
		var quoteDiv = gETL_editor.document.getElementById("quoteDIV");
		// This special div is for predefined content (possibile - for ex. - in mailto links)
		var contentDiv = gETL_editor.document.getElementById("predefinedDIV");
		if (templateReply && quoteDiv) {
			quoteDiv.textContent = gETL_origHTML;
			if (contentDiv)
				contentDiv.parentNode.removeChild(contentDiv);
		}
		else if (! templateReply) {
			if (quoteDiv)
				quoteDiv.parentNode.removeChild(quoteDiv);
			if (gMsgCompose.type == 11) {
				var bodyInnerText = bodyHTML.replace(/<[^>]+>/, "");
				// Mailto link
				if (contentDiv) {
					// Load predefined content, if it exists, in special div
					if (bodyInnerText != "") {
						// Delete "id" attribute, to avoid problems if the message would be reloaded
						contentDiv.removeAttribute("id");
						contentDiv.textContent = bodyHTML;
					}
					else
						contentDiv.parentNode.removeChild(contentDiv);
				}
				else if ( bodyInnerText != "") {
					// Append predefined content to body element
					var newDiv = gETL_editor.document.createElement("div");
					newDiv.textContent = bodyHTML;
					gETL_body.appendChild(newDiv);
				}
			}
		}


		// If the user has enabled this option, add moz-do-not-send="true" for all remote images
		var mozDoNotSendPref = tempLoadPrefs.getBoolPref("extensions.multitemplateloader.remote_images.moz_do_not_send");
		if (mozDoNotSendPref) {
			var imgs = gETL_editor.document.getElementsByTagName("img");
			for (i=0;i<imgs.length;i++) {
				var mozdonotsend = imgs[i].getAttribute("moz-do-not-send");
				if (imgs[i].src.indexOf("http") == 0 && mozdonotsend == null)
					imgs[i].setAttribute("moz-do-not-send", "true");
			}
		}

		var attachmentDIV = gETL_editor.document.getElementById("attachmentDIV");
		if (attachmentDIV) {
			var divs = attachmentDIV.getAttribute("src").split(",");
			for (var j=0;j<divs.length;j++)
				ETLcreateAttachment(divs[j]);
			attachmentDIV.parentNode.removeChild(attachmentDIV);
		}

		var type = gMsgCompose.type;

		if (type == 0 && tempLoadPrefs.getPrefType("extensions.multitemplateloader."+gETL_currentIdentity.key+".add_signature") != 0 &&
		    tempLoadPrefs.getBoolPref("extensions.multitemplateloader."+gETL_currentIdentity.key+".add_signature") && signature)
			setTimeout(ETLsetSignature,500,signature);

		if (type == 1 || type == 2 || type == 6 || type == 7 || type == 8)
			setTimeout(ETLsetCursor,600,templateReply);
		onBackgroundColorChange();
		onFontColorChange();
		gMsgCompose.bodyModified = false;
		gContentChanged = false;
	}
}

function ETLsetCursor(reply) {
	var focusDIV = gETL_editor.document.getElementById("focusDIV");
	if (reply && focusDIV) {
		try {
			gETL_editor.selectElement(focusDIV);
			gETL_editor.selectionController.scrollSelectionIntoView(Components.interfaces.nsISelectionController.SELECTION_NORMAL,      Components.interfaces.nsISelectionController.SELECTION_ANCHOR_REGION, true);
			focusDIV.removeAttribute("id");
		}
		catch(e) {}
		return;
	}
	var lastChild = gETL_body.lastChild;
	if (reply && gETL_currentIdentity.replyOnTop)
		gETL_editor.beginningOfDocument();
	else if ( (reply && ! gETL_currentIdentity.replyOnTop) || lastChild.getAttribute("id") == "scrollDIV") {
		gETL_editor.endOfDocument();
		gETL_editor.selectionController.completeScroll(true);
	}
}

function ETLsetSignature(signature) {
	var br = gETL_editor.document.createElement("br");
	gETL_body.appendChild(br);
	gETL_body.appendChild(signature);
	gMsgCompose.bodyModified = false;
	gContentChanged = false;
}

function ETLcreateAttachment(url) {
	try {
		var attachment = Components.classes["@mozilla.org/messengercompose/attachment;1"]
			.createInstance(Components.interfaces.nsIMsgAttachment);
		attachment.url = url;
		if ( typeof AddAttachment  != "undefined" )
			AddAttachment(attachment);

		else if ( typeof AddAttachments  != "undefined" )
			AddAttachments([attachment]);
		else
			AddUrlAttachment(attachment);
		ChangeAttachmentBucketVisibility(false);
	}
	catch(e){}
}

function ETLloadBlank() {
	ETLdeleteStyle();
	var editor = GetCurrentEditor();
	editor.document.body.innerHTML = "<br><br>";
	editor.document.body.removeAttribute("moz_template");
	editor.document.getElementsByTagName("head")[0].innerHTML = "<title></title>";
	// document.getElementById("cmd_loadTemplate").removeAttribute("disabled");
}

function LoadNormal(event) {
	tempLoadPrefs.setBoolPref("extensions.multitemplateloader.load.normal", true);
	event.stopPropagation();
}

function LoadExtraFile(event,index) {
	tempLoadPrefs.setIntPref("extensions.multitemplateloader.load.extra", index);
	event.stopPropagation();
}

// Thunderbird doesn't handle relative path in background attribute of BODY tag, so
// if there is just the name of a file, we modfify it adding the path of the template directory
function correctBodyBackgroundAttr(data, url) {
	// First of all, check the body TAG that must be in lower case
	data = data.replace(/<[B|b][O|o][D|d][Y|y]/, "<body");
	// Split the innerHTML with background=" string
	var preBackground = data.split("background=\"");
	// If there is no background attribute or there is an absoulte path we return the data as it is
	// The index of :// should match every protocol prefix
	if (! preBackground[1] || preBackground[1].indexOf("://") != -1)
		return data;
	else 	{
		// Otherwise we join the two parts of the innerHTML code adding the path of the directory of the template
		var plat = window.navigator.platform.toLowerCase();
		if (plat.indexOf("win") != -1 || plat.indexOf("os2") != -1)
			var dir_separator = "\\";
		else
			var dir_separator = "/";
		var temp1 = url + dir_separator + preBackground[1];
		var newdata = preBackground[0] + "background=\"file:///" + temp1;
		return newdata;
	}
}

function ETLisContentChanged() {
	if (gMsgCompose.bodyModified || gContentChanged)
		return true;
	else
		return false;
}

function AutoloadTemplateForId() {
	if (tempLoadPrefs.getBoolPref("extensions.multitemplateloader.load.auto"))
		LoadTemplateForId();
}

function LoadTemplateForId() {
	if (! gMsgCompose.composeHTML)
		return;
	gETL_currentIdentity = getCurrentIdentity();
	var blockquotes = window.content.document.getElementsByTagName("blockquote");
	var reply = false;
	if ((blockquotes[0] && blockquotes[0].getAttribute("type") == "cite") || gMsgCompose.type == 4)
		reply = true;
	extraurl = null;
	LoadTemplate(reply, true);
}

function insertTemplate(extra, templateReply = true) {
    gETL_editor = GetCurrentEditor();

    try {
        while(gETL_editor.document.getElementById("quoteDIV"))
            gETL_editor.document.getElementById("quoteDIV").removeAttribute("id");
    }
    catch(e) {}

    ETLstoreHTML();

    var templatePath = tempLoadPrefs.getCharPref("extensions.multitemplateloader.extra.file"+extra);

    var data = "";
    if(templatePath.indexOf("http") == 0 || templatePath.indexOf("ftp") == 0)
        data = LoadDataFromUrl(templatePath,true,true);
    else {
        data = LoadDataFromFile(templatePath);
        if (data)
            LoadTemplateIntoEditor(templateReply, templatePath, data, true)
    }
    tempLoadPrefs.setIntPref("extensions.multitemplateloader.load.extra", 0);
}
