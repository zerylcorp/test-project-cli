const figlet = require('figlet');
const readline = require('readline');
const SteinStore = require("stein-js-client");
const store = new SteinStore(
  "https://stein.efishery.com/v1/storages/5e1edf521073e315924ceab4"
);

const cache = {
  last10: [],
  commodity: {},
  priceRange: {}
}

const scanner = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function printListCommand(){
  console.log('1. Print 10 latest data');
  console.log('2. Search by commodity');
  console.log('3. Search by area');
  console.log('4. Search by price range');
  console.log('5. Exit');
}

async function getInput(text){
  return new Promise((resolve) => {
    scanner.question(text, selection => {
      resolve(selection)
    })
  })
}

async function printBasedOnCommodity(){
  try{
    const commodity = await getInput('Input commodity: ')
    const data = await store.read("list", {
      search: {
        komoditas: commodity.toUpperCase()
      }
    });
    console.table(data);
  }catch(err){
    console.log('An erro when load commodity data')
  }
}

async function printLatest10Data(){
  try{
  const data = await store.read("list");
  let mappedData = data.filter(d => d.uuid !== null).map(d => ({ ...d, date_obj: new Date(d.tgl_parsed)}))
  mappedData.sort((a,b) => b.date_obj.getTime() - a.date_obj.getTime())
  mappedData = mappedData.slice(0, 10)

  mappedData.forEach(d => {
    delete d.date_obj
  })

  console.table(mappedData)

  }catch(err){
    console.log('An error when latest 10 data')
  }

}

async function printBasedOnArea(){
  try{
    let selectedArea = '';
    do{
      selectedArea= await getInput('Select Area [province, city]: ')
      if(!['province', 'city'].includes(selectedArea)){
        console.log('Please type province or city')
      }
    }while(!['province', 'city'].includes(selectedArea));

    const search = await getInput(`Please type ${selectedArea} you want to search: `)

    const searchObj = {};

    if(selectedArea === 'province'){
      searchObj.area_provinsi = search.toUpperCase()
    }else if(selectedArea === 'city'){
      searchObj.area_kota = search.toUpperCase()
    }

    const data = await store.read("list", {
      search: searchObj
    });
    console.table(data);
  }catch(err){
    console.log('An erro when load commodity data')
  }
}

async function printByPriceRange(){
  try{
    let first, last;

    do{
      first = await getInput('Please input lower limit: ');
      first = Number(first)
      if(first < 0){
        console.log('Input cannot be lower than zero')
      }
    }while(!first || first < 0)

    do{
      last = await getInput('Please input upper limit: ');
      last = Number(last)
      if(last <= first){
        console.log('Upper limit must be higner than lower limit')
      } else if(last < 0){
        console.log('Input cannot be lower than zero')
      }
    }while(!last || last < 0 || last <= first) 

    const data = await store.read("list");

    const mappedData = data.map(d => ({...d, price: Number(d.price) }))
    const filteredData = mappedData.filter(d => d.price >= first && d.price <= last)
    
    console.table(filteredData)

  }catch(err){
    console.log({ err })
    console.log('Error on load ranged data')
  }
}

async function main(){
  console.log(figlet.textSync('CLI App for Tender', {
    font: 'Doom'
    }))

    let selection = '', numSelection = 0;

    do{
      printListCommand()
      selection = await getInput('Please select input [1-5]: ');
      numSelection = Number(selection)
      switch(numSelection){
        case 1:
          await printLatest10Data()
          break;
        case 2:
          await printBasedOnCommodity()
          break;
        case 3:
          await printBasedOnArea()
          break
        case 4:
          await printByPriceRange()
          break;

      }

    }while(numSelection !== 5)
    scanner.close()
}


main();
