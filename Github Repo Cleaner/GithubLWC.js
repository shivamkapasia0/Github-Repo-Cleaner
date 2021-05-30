import { LightningElement, track} from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';

export default class GithubLWC  extends NavigationMixin(LightningElement) {

    @track userName;
    @track token;
    @track repoList = [];
    @track showRepoList = [];
    @track selectedRows = [];
    @track isModalOpen = false;
    @track showList = false;
    @track error = '';
    @track data;
    @track sortBy;
    @track sortDirection;
    @track columns = [{
            label: 'Repo name',
            fieldName: 'name',
            type: 'text',
            sortable: true
        },
        {
            label: 'Created Date',
            fieldName: 'created_at',
            type: 'date',
            sortable: true
        },
        {
            label: 'Last Updated',
            fieldName: 'updated_at',
            type: 'date',
            sortable: true
        },
        {
            label: 'Repo URL',
            fieldName: 'svn_url',
            type: 'url',
            sortable: false
        }
    ];

    handleSortdata(event) {
        // field name
        this.sortBy = event.detail.fieldName;

        // sort direction
        this.sortDirection = event.detail.sortDirection;

        // calling sortdata function to sort the data based on direction and selected field
        this.sortData(event.detail.fieldName, event.detail.sortDirection);
    }

    sortData(fieldname, direction) {
        // serialize the data before calling sort function
        let parseData = JSON.parse(JSON.stringify(this.repoList));

        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };

        // cheking reverse direction 
        let isReverse = direction === 'asc' ? 1 : -1;

        // sorting data 
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';

            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });

        // set the sorted data to data table data
        this.repoList = parseData;

    }


    onUserNamechange(event) {
        this.userName = event.target.value;
        console.log('userName' + event.target.value);

    }
    onTokenChange(event) {
        this.token = event.target.value;
        console.log('password' + event.target.value);
    }

    get disableNextBtn() {
        if (this.userName && this.token) {
            return false;
        } else {
            return true;
        }
    }

    handleSelect(event) {

        const selRows = event.detail.selectedRows;
        console.log('Selected Rows are ' + JSON.stringify(selRows));
        if (this.selectedRows.length < selRows.length) {

            console.log('Selected');

        } else {

            console.log('Deselected');
            let deselectedRecs = this.selectedRows
                .filter(x => !selRows.includes(x))
                .concat(selRows.filter(x => !this.selectedRows.includes(x)));

            console.log('Deselected Recs are ' + JSON.stringify(deselectedRecs));

        }
        this.selectedRows = selRows;
        console.log('selectedRows::: ' + JSON.stringify(this.selectedRows));
    }

    get disableBtn() {
        if (this.selectedRows.length > 0) {
            return false;
        } else {
            return true;
        }

    }

    closeModal() {
        this.repoList.length = 0;
        this.isModalOpen = false;
    }

    async handleDeleteBtn() {
        let reponames = [];
        let isDeletionSuccess = false;
        let errorMsg = '';
        for (let i = 0; i < this.selectedRows.length; i++) {
            await new Promise((resolve, reject) => {
                this.deleteRepoAPI(this.selectedRows[i].full_name).then(result => {
                    resolve(result);
                    isDeletionSuccess = true;
                }).catch(error => {
                    isDeletionSuccess = false;
                    errorMsg = error;
                    reject(error);
                });

            }).catch(error => {
                console.log('error' + error);
            });

        }
        if (isDeletionSuccess) {
            this.showInfoToast('success', 'Deletion Successfull' + '');
            this.isModalOpen = false;
            location.reload();

            this.repoList.length = 0;
            this.showList = false;
        } else {
            this.showInfoToast('error', '! ' + errorMsg);
        }
    }

    handleNext() {
        this.hitGitAPI().then(json => {
            console.log('json Recieved' + JSON.stringify(json));
            for (let i = 0; i < json.length; i++) {
                this.repoList.push({
                    id: json[i].id,
                    node_id: json[i].node_id,
                    name: json[i].name,
                    full_name: json[i].full_name,
                    private: json[i].private,
                    created_at: json[i].created_at,
                    updated_at: json[i].updated_at,
                    svn_url: json[i].svn_url
                });
            }
            this.isModalOpen = true;
            this.showList = true;
            this.showInfoToast('success', 'Authorization Successfull' + '');
        }).catch(error => {
            this.showInfoToast('error', '! ' + error);
            console.log('error' + error);
        })
    }
    tokenBtnClick(){
       this[NavigationMixin.Navigate]({
            type : 'standard__webPage',
            attributes: {
                url : 'https://github.com/settings/tokens'
            }
        });
      console.log('btn clicker');
    }

    howToBtnClick(){
       this[NavigationMixin.Navigate]({
            type : 'standard__webPage',
            attributes: {
                url : 'https://github.com/shivamkapasia0/Github-Repo-Cleaner'
            }
        });
    }

    hitGitAPI() {
        return new Promise((resolve, reject) => {
            console.log('userName::' + this.userName);
            console.log('token::' + this.token);
            var endpoint = "https://api.github.com/users/" + this.userName + "/repos";
            var accessToken = "Bearer " + this.token;
            var data = new FormData();
            console.log('endpoint::' + endpoint);
            var xhr = new XMLHttpRequest();


            xhr.addEventListener("readystatechange", function() {
                if (this.readyState === 4 && this.status === 200) {
                    //console.log(this.responseText);
                    var json = JSON.parse(this.responseText);
                    resolve(json);
                } else if (this.readyState === 4 && this.status === 301) {
                    reject('Moved Permanently');
                } else if (this.readyState === 4 && this.status === 403) {
                    reject('Forbidden');
                } else if (this.readyState === 4 && this.status === 404) {
                    reject('Not Found');
                } else if (this.readyState === 4 && this.status === 401) {
                    reject('Invalid Credentials');
                }
            });

            xhr.open("GET", endpoint);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Authorization", accessToken);

            xhr.send(data);

        });

    }

    deleteRepoAPI(repoName) {
        return new Promise((resolve, reject) => {
            var endpoint = "https://api.github.com/repos/" + repoName;
            var accessToken = "Bearer " + this.token;


            var xhr = new XMLHttpRequest();;

            xhr.addEventListener("readystatechange", function() {
                if (this.readyState === 4 && this.status === 204) {
                    resolve('deleted');
                } else if (this.readyState === 4 && this.status === 307) {
                    reject('Temporary Redirect');

                } else if (this.readyState === 4 && this.status === 403) {
                    reject('Forbidden');
                } else if (this.readyState === 4 && this.status === 204) {
                    reject('Not Found');
                }
            });

            xhr.open("DELETE", endpoint);
            xhr.setRequestHeader("Authorization", accessToken);

            xhr.send();

        });
    }

    showInfoToast(variant, title, message) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: 'dismissable'
        });
        this.dispatchEvent(evt);
        if (variant === 'error') {
            this.closeModal();
        }

    }
}
