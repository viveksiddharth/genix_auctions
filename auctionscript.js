var app = angular.module('auctionapp',[]);

app.controller('myctrl1' , ['$scope','$http','$window','$interval', function($scope,$http,$window,$interval){
    $scope.adddetails = false;
    $scope.addnew = true;

    $scope.additem = function(){
        $scope.adddetails = true;
        $scope.addnew = false;
    }

    $scope.display3 = function(){
       
        $http.post('/display-auction-items')
        .then(function(response){
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
             $window.loaction.href='/yourauctions'
        })
    }

    $scope.removeitem = function(id){
        console.log(id)
        $http.post('/remove-item',{aid:id})
        .then(function(response){
            $window.location.href = '/yourauctions'
        })
    }

    $scope.uploadItem = function(){
        var fileInput = document.getElementById('imageInput');
                var file = fileInput.files[0];

                if (!file) {
                    alert('Please select an image.');
                    return;
                }

                var reader = new FileReader();
                reader.onload = function(e) {
                    var base64Image = e.target.result;

                    var endDate = new Date($scope.end_date);
                    var formattedEndDate = endDate.getFullYear() + '-' +
                        ('0' + (endDate.getMonth() + 1)).slice(-2) + '-' +
                        ('0' + endDate.getDate()).slice(-2) + ' ' +
                        ('0' + endDate.getHours()).slice(-2) + ':' +
                        ('0' + endDate.getMinutes()).slice(-2) + ':' +
                        ('0' + endDate.getSeconds()).slice(-2);
        
                    var itemData = {
                        name: $scope.name,
                        minbid: $scope.minbid,
                        end_date: formattedEndDate,
                        description: $scope.description,
                        image: base64Image
                    };
        
                    $http.post('/upload-item', itemData)
                    .then(function(response) {
                        $window.location.href = '/yourauctions';
                    })
                    .catch(function(err) {
                        console.log(err);
                    });
                };
                reader.readAsDataURL(file);
    }

    $scope.openauctions = function(){
        $window.location.href = '/yourauctions';
    }
    $scope.openbidding = function(){
        $window.location.href = '/homepage';
    }

    $scope.openprofile = function(){
        $scope.showDropdown = !$scope.showDropdown;
    }

    
    $scope.logout = function(){
        $http.post('/logout')
        .then(function(response){
            $window.location.href='/'
            console.log("success");
        })
    }
}])