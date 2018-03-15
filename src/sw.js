import scrapper from 'jobs-dou-statistics-scrapper';
import mapLimit from 'async/mapLimit';
import promisify from "promisify-es6";
//const aMapLimit = promisify(mapLimit);

let token;

const grabVacancies = async () => {
    const categories = await scrapper.grabCategories();

    const promise = new Promise((success, error) => {
        mapLimit(categories, 3, async function (category) {
            console.log(`start track ${category.name} `)
            const vacancies = await scrapper.grabVacancies(category.name);

            vacancies.forEach(vacancy => {
                vacancy.salary = vacancy.salary || null;
                vacancy.category = category.name;
                delete vacancy.desc;
            });

            return vacancies;
        }, (err, vss) => {
            if (err) {
                error(err);
                return;
            }

            const vs = vss.reduce((acc, vs) => [...acc, ...vs], []);

            success(vs);
        });
    });

    return promise;
}


const uploadVacancies = async (vs) => {
    return fetch('/vacancies', {
        method: 'post',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(vs)
    })
        .then(res => res.json())
        .then(res => console.log(res));
};

const getActiveVacanciesIds = async () => {
    const res = await fetch('/vacancies_active_ids', {
        method: 'get',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        }
    });
    return await res.json();
};


const getVacanciesToCheck = async () => {
    const res = await fetch('/vacancies_tocheck', {
        method: 'get',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
    })
    return await res.json();
};



self.addEventListener('periodicsync', function(event) {
    if (event.registration.tag == 'ping') {
      console.log('PING !!!!!!!!!');
    }
  });


self.addEventListener('message', function (event) {
    let p;
    token = event.data.token;
    console.log(event);

    switch (event.data.command) {
        case 'GET_NEW':
            p = async () => {
                const idsPromise = getActiveVacanciesIds();
                const vs = await grabVacancies();
                const ids = await idsPromise;
                const fvs = vs.filter(v => !ids[v.id]);

                return fvs.lenght ? uploadVacancies(fvs) : true;
            }
            break;
        case 'CHECK_STATUS':
            p = async () => {
                const vs = await getVacanciesToCheck();
                console.log(vs);
            }
            break;
    }

    event.waitUntil(p());

});
