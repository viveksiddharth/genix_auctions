var app = angular.module('loginApp', []);

app.controller('LoginController', ['$scope', '$window', '$http', function($scope,$window,$http) {

    $scope.showlogin = true;
    
    $scope.login = function(){
        $http.post('/login',{email:$scope.toemail1,password:$scope.password1})
        .then(function(response){
            if(response.data.success)
            {
                if(response.data.credentials)
                {
                    $window.location.href='/homepage';
                }
                else
                {
                    $scope.passstyle={
                        'border' : '1px solid red'
                    }
                    $window.alert("User doesnot exist try signing up");
                }
            }
        })
    }

    $scope.signup = function(){
        $http.post('/signup',{fname:$scope.fname , sname:$scope.lname, email:$scope.toemail2 , password:$scope.password2})
        .then(function(response){
            if (response.data.success)
            {
                $scope.showlogin = true
                $scope.showsignup = false
                $window.alert("Account created succesfully");
            }

        })
    }

    $scope.gotosignin = function(){
        $scope.showlogin = true;
        $scope.showsignup = false;
    }
    $scope.gotosignup = function(){
        $scope.showlogin = false;
        $scope.showsignup = true;
    }
}]);
