var ETLprefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

﻿function queryISupportsArray(supportsArray, iid) {
    var result = new Array;
    var counter = supportsArray.Count ? supportsArray.Count() : supportsArray.length;
    for (var i=0; i<counter; i++) {
        if (supportsArray.Count)
            result[i] = supportsArray.QueryElementAt(i, iid);
        else
            result[i] = supportsArray.queryElementAt(i, iid);
    }
    return result;
}

function FillIdentityListPopup(id) {
    var popup = document.getElementById("msgIdentityPopup");
    var sel = null;
    var am = Components.classes["@mozilla.org/messenger/account-manager;1"]
        .getService(Components.interfaces.nsIMsgAccountManager);
    var accounts = queryISupportsArray(am.accounts, Components.interfaces.nsIMsgAccount);
    for (var i in accounts) {
        var server = accounts[i].incomingServer;
        if (!server)
            continue;
        var identites = queryISupportsArray(accounts[i].identities, Components.interfaces.nsIMsgIdentity);
        for (var j in identites) {
            var identity = identites[j];
            var item = document.createElement("menuitem");
            item.className = "identity-popup-item";
            item.setAttribute("label", identity.identityName);
            item.setAttribute("value", identity.key);
            item.setAttribute("accountkey", accounts[i].key);
            item.setAttribute("accountname", " - " + server.prettyName);
            if (! sel && (! id || ! id.key ||  identity.key == id.key) ) {
                sel = item;
                var key = identity.key;
            }
            popup.appendChild(item);
        }
    }
    document.getElementById("msgIdentity").selectedItem = sel;
    setTimeout(GetTemplateForIdentity, 500, key);
}


function GetTemplateForIdentity(key) {
    if (! key) {
        var sel = document.getElementById("msgIdentity").selectedItem;
        key =  sel.getAttribute("value");
    }
    if (ETLprefs.getPrefType("extensions.multitemplateloader."+key+".file") != 0)
        document.getElementById("TemplateURI").value=  ETLprefs.getCharPref("extensions.multitemplateloader."+key+".file");
    else
        document.getElementById("TemplateURI").value= "";
    if (ETLprefs.getPrefType("extensions.multitemplateloader."+key+".enable") != 0)
        document.getElementById("TemplateEnable").checked= ETLprefs.getBoolPref("extensions.multitemplateloader."+key+".enable");
    else
        document.getElementById("TemplateEnable").checked=false;
    if (ETLprefs.getPrefType("extensions.multitemplateloader."+key+".enable_reply_forward") != 0)
        document.getElementById("TemplateReply").checked= ETLprefs.getBoolPref("extensions.multitemplateloader."+key+".enable_reply_forward");
    else
        document.getElementById("TemplateReply").checked=false;
    if (ETLprefs.getPrefType("extensions.multitemplateloader."+key+".disable_reply_recursive") != 0)
        document.getElementById("TemplateReplyRecursive").checked= ETLprefs.getBoolPref("extensions.multitemplateloader."+key+".disable_reply_recursive");
    else
        document.getElementById("TemplateReplyRecursive").checked=false;
    if (ETLprefs.getPrefType("extensions.multitemplateloader."+key+".add_signature") != 0)
        document.getElementById("AddSignature").checked= ETLprefs.getBoolPref("extensions.multitemplateloader."+key+".add_signature");
    else
        document.getElementById("AddSignature").checked=false;

    checkReplyBox();
}

function loadTemplatePrefs() {
    var identity = window.arguments[0];
    FillIdentityListPopup(identity);
    document.getElementById("mozsend").checked = ETLprefs.getBoolPref("extensions.multitemplateloader.remote_images.moz_do_not_send");
    document.getElementById("charset").checked = ETLprefs.getBoolPref("extensions.multitemplateloader.charset.ignore");
    document.getElementById("checkHTML").checked = ETLprefs.getBoolPref("extensions.multitemplateloader.load.checkHTML");
    document.getElementById("autoLoadConfirm").checked = ETLprefs.getBoolPref("extensions.multitemplateloader.load_warning");
    document.getElementById("autoLoadEnable").checked = ETLprefs.getBoolPref("extensions.multitemplateloader.load.auto");
}

function saveTemplatePrefs() {
    var sel = document.getElementById("msgIdentity").selectedItem;
    var key = sel.getAttribute("value");

    ETLprefs.setCharPref("extensions.multitemplateloader."+key+".file", document.getElementById("TemplateURI").value);
    ETLprefs.setBoolPref("extensions.multitemplateloader."+key+".enable", document.getElementById("TemplateEnable").checked);
    ETLprefs.setBoolPref("extensions.multitemplateloader."+key+".enable_reply_forward", document.getElementById("TemplateReply").checked);
    ETLprefs.setBoolPref("extensions.multitemplateloader."+key+".disable_reply_recursive", document.getElementById("TemplateReplyRecursive").checked);
    ETLprefs.setBoolPref("extensions.multitemplateloader."+key+".add_signature", document.getElementById("AddSignature").checked);

    ETLprefs.setBoolPref("extensions.multitemplateloader.remote_images.moz_do_not_send", document.getElementById("mozsend").checked)
    ETLprefs.setBoolPref("extensions.multitemplateloader.charset.ignore", document.getElementById("charset").checked);
    ETLprefs.setBoolPref("extensions.multitemplateloader.load.checkHTML", document.getElementById("checkHTML").checked);
    ETLprefs.setBoolPref("extensions.multitemplateloader.load.auto", document.getElementById("autoLoadEnable").checked);
    ETLprefs.setBoolPref("extensions.multitemplateloader.load_warning", document.getElementById("autoLoadConfirm").checked);
}

function showFilePicker() {
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Template", nsIFilePicker.modeOpen);
    fp.appendFilters(nsIFilePicker.filterHTML);
    fp.open(res => {
        if (res == nsIFilePicker.returnOK) {
            var filePath = fp.file.path;
            document.getElementById("TemplateURI").value = filePath;
        }
    });
}

function checkReplyBox() {
    document.getElementById("TemplateReply").disabled = ! (document.getElementById("TemplateEnable").checked);
    document.getElementById("AddSignature").disabled = ! (document.getElementById("TemplateEnable").checked);
    document.getElementById("TemplateReplyRecursive").disabled = ! (document.getElementById("TemplateEnable").checked);
}

function checkRecursiveBox(el) {
    document.getElementById("TemplateReplyRecursive").disabled = ! el.checked;
}


