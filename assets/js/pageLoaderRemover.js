   // Function to remove the loader and show content
        function removeLoader(isHomePage = false) {
            document.getElementById('page-loader').classList.add('opacity-0');
            setTimeout(function () {
              document.getElementById('page-loader').style.opacity = 0 
              document.body.classList.remove("page-loader-active")
              
          
             hidePageLoader()

             if(isHomePage){
               updateCheck()
             }

            }, 3150); // completes animations at this time 
          
        }
