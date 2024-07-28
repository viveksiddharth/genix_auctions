var app = angular.module("myappmainpage", []);

app.controller("myctrl1", ['$scope', '$http', '$window', '$interval',function($scope, $http, $window,$interval) {

    $scope.items = [];
    $scope.name = '';
    $scope.showAll = false;
    $scope.limit=5;
    $scope.showDropdown = false;

    $scope.openprofile = function(){
        $scope.showDropdown = !$scope.showDropdown;
    }

    $scope.d2 = function(){
        $scope.showDropdown = false;
    }

    $scope.display = function() {
       
        $http.post('/display')
            .then(function(response) {
                if (response.data.success) {
                    console.log(response.data.name);
                    $scope.name = response.data.name;
                    $scope.items = response.data.items;

                    $scope.items.forEach(item=>{
                        item['dur']='';
                    })


                    function updateRemainingTime() {
                        let currentTime = new Date();
                        $scope.items.forEach(item => {

                                let endTime = new Date(item.end_date);
                                if(isNaN(endTime.getTime())){
                                    item.end_date = "Invalid date";
                                } else {
                                let timeDifference = endTime - currentTime;
                                if (timeDifference <= 0) {
                                    item.endsIn = "Expired";
                                } else {
                                    let days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                                    let hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                    let minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
                                    let seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
            
                                    item.dur = `${days}d ${hours}h ${minutes}m ${seconds}s` ;
                                }
                             }
                        });
                
                    }
            
                    updateRemainingTime();
            
                    $interval(updateRemainingTime, 1000);

                     $window.loaction.href='/homepage'

                } else {
                    console.error('Failed to fetch data');
                }
            })
            .catch(function(error) {
                console.error('Error fetching items:', error);
            });
    };

    $scope.gotobid = function(id) {
        $http.post('/gotobid', { aid: id })
            .then(function(response) {
                if (response.data.success) {
                    $window.location.href = '/itempage';
                } else {
                    console.error('Failed to navigate to bid page');
                }
            })
            .catch(function(error) {
                console.error('Error navigating to bid page:', error);
            });
    };

    $scope.toggleItems = function() {
        if ($scope.showAll) {
            $scope.limit = 5;
        } else {
            $scope.limit = $scope.items.length;
        }
        $scope.showAll = !$scope.showAll; 
    };

    $scope.openauctions = function(){
        $window.location.href = '/yourauctions';
    }
    $scope.openbidding = function(){
        $window.location.href = '/homepage';
    }

    $scope.logout = function(){
        $http.post('/logout')
        .then(function(response){
            $window.location.href='/'
            console.log("success");
        })
    }
}]);
