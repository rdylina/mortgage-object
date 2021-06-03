/* Copyright 2021 Robert J Dylina*/
class Mortgage {
  
  constructor(setup){
    console.log("creating mortgage object");
    // Setup our defaults
    this.term = 360;
    this.type = "Conventional";
    this.rate = 3.375;
    this.purchasePrice = 300_000;
    this.loan = 200_000;
    this.MIRate = 1.0;
    this.MICancel = true;
    this.MICancelPercent = 78;
    this.MIConstantRenewal = true;
    this.UFMIP = 1.75;
    this.MIFinanced = false;

    // This is an array of objects that represent payments (Amortization Table)
    this.payments = new Array();
      
    // iterate through the parameters passed in the setup object and assign them to internal variables.
    if(setup)
      Object.keys(setup).forEach(key => { this[key] = setup[key] } );

    // Computed Values
    this.loanTotal = this.MIFinanced ? this.loan * (1 + (this.UFMIP / 100)) : this.loan;
    this.downPayment = (this.purchasePrice - this.loan) / this.purchasePrice;

    // Log all the terms set
    console.log("Term: "+ this.term);
    console.log("Type: "+ this.type);
    console.log("Rate: "+ this.rate);
    console.log("Purchase Price: "+ this.purchasePrice);
    console.log("Loan Amount: "+ this.loanAmount);

    // Calculate Payments and setup Amortization Table
    this.calculatePayments();
   
  } // end constructor
    
  

  calculatePayments(){
    console.log("calculating payments");
    let _tmpBalance = this.loan;
    let _monthlyRate = ((this.rate/100)/12);
    let _x = Math.pow(1+_monthlyRate,this.term);
    let _payment = (_tmpBalance * _monthlyRate * (_x/(_x-1))).toFixed(2);
    
    // Utility Function to trim down to 2 digits without rounding
    // TODO replace with Math.Floor solution
    function trimDigits(number){
      if(number.toString().indexOf('.') > -1){
        let numberArray = number.toString().split(".");
        return parseFloat(numberArray[0] + "." + numberArray[1][0] + numberArray[1][1]);
      } else {
        return number;
      }
    }
   
    //Setup first payment
    this.payments[0] = {
        paymentNumber:1,
        payment:_payment,
        startingBalance:_tmpBalance,
        get interest() { return trimDigits(_monthlyRate * this.startingBalance)},
        get principal() { return trimDigits(this.payment - this.interest)},
        get endingBalance() { return trimDigits(this.startingBalance - this.principal)},
        LTV:trimDigits(this.loan / this.purchasePrice * 100),
      };
    
    // loop through and calculate remaining payments
    for(let i = 0; i < this.term; i++){
    // add payments 2 through end  
      this.payments[i] = {
        paymentNumber:i+1,  
        startingBalance:(i === 0) ? this.loan : this.payments[i-1].endingBalance,
        payment:((i != 0 && _payment > this.payments[i-1].endingBalance) ? this.payments[i-1].endingBalance : _payment),
        get interest() { return trimDigits(_monthlyRate * this.startingBalance)},
        get principal() { return trimDigits(this.payment - this.interest)},
        get endingBalance() { 
          if(this.payment === this.startingBalance)
            return 0;
          else
          return trimDigits(this.startingBalance - this.principal)},
      };

      // Computed Values
      this.payments[i].LTV = trimDigits(this.payments[i].endingBalance / this.purchasePrice * 100);

      // Calculate the MI Payment
      switch(this.type){
        case "Conventional":
        if(this.MICancel && this.payments[i].LTV >= this.MICancelPercent){
          if(this.MIConstantRenewal)
            this.payments[i].MIPayment = trimDigits((this.loan * (this.MIRate / 100)) / 12);
           else 
            this.payments[i].MIPayment = 0;
            // TODO correct this for declining balance MI
        } else {
          this.payments[i].MIPayment = 0;
        }
        break;

        case "FHA":
          this.payments[i].MIPayment = trimDigits((this.loan * .0085) / 12);
          break;

        case "VA":
          // TODO do VA calcs

        case "USDA":
          // TODO do USDA calcs

        default:
          this.payments[i].MIPayment = 1;
          break;

        
      }
    }// End of for loop
  } // End function calculatePayments
  
  outputAmortizationTable(){
    if(this.payments){
      let collector = 
       `<table class="table table-striped">
        <tbody>
          <thead class="thead-dark">
            <td>Payment Number</td>
            <td>Payment</td>
            <td>Interest</td>
            <td>Principal</td>
            <td>MI Payment</td>
            <td>Starting Balance</td>
            <td>Ending Balance</td>
            <td>LTV</td>
          </thead>`;
      
      this.payments.map(singlePayment => collector += 
              `<tr> 
                <td>${singlePayment.paymentNumber}</td> 
                <td>${singlePayment.payment}</td>
                <td>${singlePayment.interest}</td>
                <td>${singlePayment.principal}</td>
                <td>${singlePayment.MIPayment}</td>
                <td>${singlePayment.startingBalance}</td>    
                <td>${singlePayment.endingBalance}</td> 
                <td>${singlePayment.LTV}%</td>
              </tr>`);
      collector += `</tbody></table>`;
    
      return collector;
    }
   } // End Function outputAmortizationTable

  getPaymentDetails(number)
  {
    if(this.payment)return this.payment[number-1];
  }
  
  // Returns all public object properties except for payments array
  getLoanDetails(){
    let accumulator = {};
    Object.keys(this).forEach((key, index) => {if (key != "payments") accumulator[key] = this[key];});
    return accumulator;
  } // End function getLoanDetails
  
  getTotalInterest(){
    // return sum of all interest
  }
  
  getTotalPayments()
  {
    // return sum of all payments
  }
  
  getPaymentsTillInterest(number){
    // return number of payments until parameter number is hit
  }
  
 } // End class Mortgage

let currentMortgage = new Mortgage({
  term:360,
  type:"Conventional",
  rate:5.000,
  purchasePrice:300_000,
  loan:250_000
});

document.body.innerHTML = `<pre class="text-center">${JSON.stringify(currentMortgage.getLoanDetails(), null, 2)}</pre>`;
document.body.innerHTML += currentMortgage.outputAmortizationTable();
