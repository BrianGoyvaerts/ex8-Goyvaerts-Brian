var request = require("request");
var dal = require('./storage.js');

// http://stackoverflow.com/questions/10888610/ignore-invalid-self-signed-ssl-certificate-in-node-js-with-https-request
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


var BASE_URL = "https://web-ims.thomasmore.be/datadistribution/API/2.0";
var Settings = function (url) {
	this.url = BASE_URL + url;
	this.method = "GET";
	this.qs = {format: 'json'};
	this.headers = {
		authorization: "Basic aW1zOno1MTJtVDRKeVgwUExXZw=="
	};
};

var Drone = function (droneID, drone_url, name, drone_mac_address, location, last_packet_date, files_url, file_count) {
	this._id = droneID; 
        this.drone_url = drone_url; 
	this.name = name;
	this.drone_mac_address = drone_mac_address;
        this.location = location; 
        this.last_packet_date = last_packet_date; 
        this.files_url = files_url; 
        this.file_count = file_count; 
};
var File = function (drone_ref, fileID, file_url, date_loaded, date_first_record, date_last_record, contents_url, content_count) {
	this.drone_ref = drone_ref; 
        this._id = fileID; 
        this.file_url = file_url; 
	this.date_loaded = date_loaded; 
        this.date_first_record = date_first_record; 
        this.date_last_record = date_last_record; 
        this.contents_url = contents_url; 
        this.content_count = content_count; 
}; 
var Content = function(file_ref, contentID, content_url, mac_address, datetime, rssi) {
        this.file_ref = file_ref; 
        this._id = contentID; 
        this.content_url = content_url; 
        this.mac_address = mac_address; 
        this.datetime = datetime; 
        this.rssi = rssi;            
}; 

var dronesSettings = new Settings("/drones?format=json");

dal.clearDrone();
dal.clearFile();
dal.clearContent();

request(dronesSettings, function (error, response, dronesString) {
	var drones = JSON.parse(dronesString);
	drones.forEach(function (drone) {
            var droneSettings = new Settings("/drones/" + drone.id + "?format=json");
            request(droneSettings, function (error, response, droneString) {
		var drone = JSON.parse(droneString);
		dal.insertDrone(new Drone(
                    drone.droneID, 
                    drone.drone_url, 
                    drone.name, 
                    drone.drone_mac_address, 
                    drone.location, 
                    drone.last_packet_date, 
                    drone.files_url, 
                    drone.file_count));
                                
                var filesSettings = new Settings("/files?drone_id.is=" + drone.id + "?format=json");
		request(filesSettings, function (error, response, filesString) {
                    var files = JSON.parse(filesString);
                        
                    files.forEach(function(file) {
                        var fileDetailSetting = new Settings("/files/" + file.id + "?format=json");
                        request(fileDetailSetting, function (error, response, fileDetailString) {
                            var fileDetail = JSON.parse(fileDetailString); 
                              
			dal.insertFile(new File(
                            fileDetail.drone_ref,  
                            fileDetail.fileID,  
                            fileDetail.file_url,  
                            fileDetail.date_loaded,  
                            fileDetail.date_first_record,  
                            fileDetail.date_last_record,  
                            fileDetail.contents_url,
                            fileDetail.content_count));
                                
                        var contentsSettings = new Settings("/files/" + file.id + "/contents/"+"?format=json");
                            request(contentsSettings, function (error, response, contentsString) {
                                var contents = JSON.parse(contentsString);
                                    

                                contents.forEach(function (content) {
                                    var contentDetailSetting = new Settings("/files/" + file.id + "/contents/" + content.id + "?format=json");
                                    request(contentDetailSetting, function (error, response, contentDetailString) {
                                            var contentDetail = JSON.parse(contentDetailString);
                                            dal.insertContent(new Content(
                                                contentDetail.file_ref,
                                                contentDetail.contentID,
                                                contentDetail.content_url,
                                                contentDetail.mac_address,
                                                contentDetail.datetime,
                                                contentDetail.rssi,
                                                drone.id,
                                                file.id));     
                                            
                                        });
                                    });
                                });
                            
                        }); 
                    }); 
                }); 
            }); 
        }); 
    }); 
console.log("Hello World!");
