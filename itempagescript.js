var app = angular.module('itemapp',[]);

app.controller('myctrl1',['$scope','$http','$window','$interval' , function($scope,$http,$window,$interval){
    $scope.dshowbid = true;
    $scope.errmsg=false;

    $scope.display2 = function(){
        console.log("hello")
        $http.post('/get-product-details')
        .then(function(response){
            console.log(response.data.reviews)
            $scope.item = response.data.product;
            $scope.reviews = response.data.reviews;
            $scope.bids = response.data.previousbids;

                $scope.item['dur']='';
                console.log($scope.item)


            function updateRemainingTime() {
                let currentTime = new Date();

                        let endTime = new Date($scope.item.end_date);
                        if(isNaN(endTime.getTime())){
                            $scope.item.end_date = "Invalid date";
                        } else {
                        let timeDifference = endTime - currentTime;
                        if (timeDifference <= 0) {
                            $scope.item.endsIn = "Expired";
                        } else {
                            let days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
                            let hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            let minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
                            let seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
    
                            $scope.item.dur = `${days}d ${hours}h ${minutes}m ${seconds}s` ;
                        }
                     }
        
            }
    
            updateRemainingTime();
    
            $interval(updateRemainingTime, 1000);
            $window.loaction.href='/itempage'
        })
    }
    $scope.showbiddialog = function(){
        $scope.dshowbid = false;
        $scope.showbid = true;
    }
    $scope.addbid = function(){
        $http.post('/addbid' ,{bamnt:$scope.bidamnt})
        .then(function(response){
            if(response.data.success){
                $scope.dshowbid = true;
                $scope.showbid = false;
                $window.location.href='itempage';
            }
            else{
                $scope.errstyle ={
                     'border' : '2px solid red'
                }
                $scope.errmsg = true;
                $scope.errmessage = response.data.message;
            }
        })
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

    // $scope.item = {id:1,image:"img1.jpeg",name:"Sony Headphones",minbid:100,curbid:150
    //     , description:"Sony headphones are renowned for their exceptional audio quality, combining advanced technology with sleek design. They offer a wide range of models, from over-ear to in-ear, catering to different user preferences. The noise-canceling capabilities of Sony headphones, particularly in the WH-1000XM series, are highly acclaimed, providing an immersive listening experience by blocking out ambient noise. Sony's headphones often feature high-resolution audio, delivering crystal-clear sound with rich bass and detailed highs. Many models are equipped with wireless Bluetooth connectivity, ensuring convenience and freedom of movement. The ergonomic design ensures a comfortable fit for prolonged use. With long battery life, Sony headphones are perfect for extended listening sessions. They also include intuitive touch controls and voice assistant compatibility for easy operation. Whether for music, gaming, or calls, Sony headphones consistently deliver top-notch performance."
    // }

    // $scope.reviews = [
    //     {rid:1,user:"mark",rating:4.5,rev:"good it is awesome and the sound quality is amazing."},
    //     {rid:2,user:"mark",rating:4.5,rev:"good it is awesome and the sound quality is amazing."},
    //     {rid:1,user:"mark",rating:4.5,rev:"good it is awesome and the sound quality is amazing."}
    // ]
}])