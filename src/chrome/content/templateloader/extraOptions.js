	var extraTemPrefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

	var extraTemplate = {
	load: function() {
		if (extraTemPrefs.getPrefType("extensions.multitemplateloader.extra.file1") != 0)
			document.getElementById("extraURI1").value = extraTemPrefs.getCharPref("extensions.multitemplateloader.extra.file1");
		else
			document.getElementById("extraURI1").value = "";
		if (extraTemPrefs.getPrefType("extensions.multitemplateloader.extra.file2") != 0)
			document.getElementById("extraURI2").value = extraTemPrefs.getCharPref("extensions.multitemplateloader.extra.file2");
		else
			document.getElementById("extraURI2").value = "";
		if (extraTemPrefs.getPrefType("extensions.multitemplateloader.extra.file3") != 0)
			document.getElementById("extraURI3").value = extraTemPrefs.getCharPref("extensions.multitemplateloader.extra.file3");
		else
			document.getElementById("extraURI3").value = "";
		if (extraTemPrefs.getPrefType("extensions.multitemplateloader.extra.file4") != 0)
			document.getElementById("extraURI4").value = extraTemPrefs.getCharPref("extensions.multitemplateloader.extra.file4");
		else
			document.getElementById("extraURI4").value = "";
		if (extraTemPrefs.getPrefType("extensions.multitemplateloader.extra.file5") != 0)
			document.getElementById("extraURI5").value = extraTemPrefs.getCharPref("extensions.multitemplateloader.extra.file5");
		else
			document.getElementById("extraURI5").value = "";
		if (extraTemPrefs.getPrefType("extensions.multitemplateloader.extra.file6") != 0)
			document.getElementById("extraURI6").value = extraTemPrefs.getCharPref("extensions.multitemplateloader.extra.file6");
		else
			document.getElementById("extraURI6").value = "";
		if (extraTemPrefs.getPrefType("extensions.multitemplateloader.extra.file7") != 0)
			document.getElementById("extraURI7").value= extraTemPrefs.getCharPref("extensions.multitemplateloader.extra.file7");
		else
			document.getElementById("extraURI7").value = "";
		if (extraTemPrefs.getPrefType("extensions.multitemplateloader.extra.file8") != 0)
			document.getElementById("extraURI8").value = extraTemPrefs.getCharPref("extensions.multitemplateloader.extra.file8");
		else
			document.getElementById("extraURI8").value = "";
		if (extraTemPrefs.getPrefType("extensions.multitemplateloader.extra.file9") != 0)
			document.getElementById("extraURI9").value = extraTemPrefs.getCharPref("extensions.multitemplateloader.extra.file9");
		else
			document.getElementById("extraURI9").value = "";
	},

	save: function() {
		if (document.getElementById("extraURI1").value != "")
			extraTemPrefs.setCharPref("extensions.multitemplateloader.extra.file1", document.getElementById("extraURI1").value);
		else
			extraTemPrefs.deleteBranch("extensions.multitemplateloader.extra.file1");
		if (document.getElementById("extraURI2").value != "")
			extraTemPrefs.setCharPref("extensions.multitemplateloader.extra.file2", document.getElementById("extraURI2").value);
		else
			extraTemPrefs.deleteBranch("extensions.multitemplateloader.extra.file2");
		if (document.getElementById("extraURI3").value != "")
			extraTemPrefs.setCharPref("extensions.multitemplateloader.extra.file3", document.getElementById("extraURI3").value);
		else
			extraTemPrefs.deleteBranch("extensions.multitemplateloader.extra.file3");
		if (document.getElementById("extraURI4").value != "")
			extraTemPrefs.setCharPref("extensions.multitemplateloader.extra.file4", document.getElementById("extraURI4").value);
		else
			extraTemPrefs.deleteBranch("extensions.multitemplateloader.extra.file4");
		if (document.getElementById("extraURI5").value != "")
			extraTemPrefs.setCharPref("extensions.multitemplateloader.extra.file5", document.getElementById("extraURI5").value);
		else
			extraTemPrefs.deleteBranch("extensions.multitemplateloader.extra.file5");
		if (document.getElementById("extraURI6").value != "")
			extraTemPrefs.setCharPref("extensions.multitemplateloader.extra.file6", document.getElementById("extraURI6").value);
		else
			extraTemPrefs.deleteBranch("extensions.multitemplateloader.extra.file6");
		if (document.getElementById("extraURI7").value != "")
			extraTemPrefs.setCharPref("extensions.multitemplateloader.extra.file7", document.getElementById("extraURI7").value);
		else
			extraTemPrefs.deleteBranch("extensions.multitemplateloader.extra.file7");
		if (document.getElementById("extraURI8").value != "")
			extraTemPrefs.setCharPref("extensions.multitemplateloader.extra.file8", document.getElementById("extraURI8").value);
		else
			extraTemPrefs.deleteBranch("extensions.multitemplateloader.extra.file8");
		if (document.getElementById("extraURI9").value != "")
			extraTemPrefs.setCharPref("extensions.multitemplateloader.extra.file9", document.getElementById("extraURI9").value);
		else
			extraTemPrefs.deleteBranch("extensions.multitemplateloader.extra.file9");
	},

	filePicker: function(buttonnode) {
		var filePath = getFilePathFromFilepicker();
		if (filePath) 
			buttonnode.previousSibling.value = filePath;
	}
};
