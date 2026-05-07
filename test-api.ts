console.log("running test...");
fetch('https://ophim1.com/v1/api/danh-sach/hoat-hinh?limit=24&page=1')
  .then(res => res.json())
  .then(v => {
      const pathImage = 'https://phimimg.com/';
      const rawItems = v?.items || v?.data?.items || [];
      console.log('rawItems length:', rawItems.length);
  }).catch(console.error);
