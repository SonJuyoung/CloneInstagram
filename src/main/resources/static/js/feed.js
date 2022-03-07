function getDateTimeInfo(dt) {
    const nowDt = new Date();
    const targetDt = new Date(dt);

    const nowDtSec = parseInt(nowDt.getTime() / 1000);
    const targetDtSec = parseInt(targetDt.getTime() / 1000);

    const diffSec = nowDtSec - targetDtSec;
    if(diffSec < 120) {
        return '1분 전';
    } else if(diffSec < 3600) { //분 단위
        return `${parseInt(diffSec / 60)}분 전`;
    } else if(diffSec < 86400) { //시간 단위
        return `${parseInt(diffSec / 3600)}시간 전`;
    } else if(diffSec < 604800) { //일 단위
        return `${parseInt(diffSec / 86400)}일 전`;
    }
    return targetDt.toLocaleString();
}

const feedObj = {
    limit: 5,
    itemLength: 0,
    currentPage: 1,
    url: '/feed/list',
    iuser: 0,
    swiper: null,
    containerElem: document.querySelector('#item_container'),
    loadingElem: document.querySelector('.loading'),
    makeFeedList: function(data) {
        if(data.length == 0) { return; }

        for(let i=0; i<data.length; i++) {
            const item = data[i];

            const itemContainer = document.createElement('div');
            itemContainer.className = 'item mb-3';

            // 글쓴이 정보 영역
            let imgTag = ``;
            if(item.mainProfile != null) {
                imgTag = `<img src="/pic/profile/${item.iuser}/${item.mainProfile}" class="pointer profile wh30" 
                onclick="moveToProfile(${item.iuser});" onerror="this.style.display='none';">`;
            }
            const regDtInfo = getDateTimeInfo(item.regdt);
            const topDiv = document.createElement('div');
            topDiv.classList.add('top')
            topDiv.innerHTML = `
                <div class="itemProfileCont">${imgTag}</div>
                <div class="p-3">
                    <div><span class="pointer" onclick="moveToProfile(${item.iuser});">${item.writer}</span> - ${regDtInfo}</div>
                    <div>${item.location == null ? '' : item.location}</div>
                </div>
            `;

            //이미지영역
            const imgSwiperDiv = document.createElement('div');
            imgSwiperDiv.className = 'swiper item_img';
            imgSwiperDiv.innerHTML = `
                <div class="swiper-wrapper"></div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            `;

            const swiperWrapperElem = imgSwiperDiv.querySelector('.swiper-wrapper');

            for(let z=0; z<item.imgList.length; z++) {
                const imgObj = item.imgList[z];

                const swiperSlideDiv = document.createElement('div');
                swiperSlideDiv.classList.add('swiper-slide');

                const img = document.createElement('img');
                img.className = 'w614';
                img.src = `/pic/feed/${item.ifeed}/${imgObj.img}`;
                swiperSlideDiv.append(img);
                swiperWrapperElem.append(swiperSlideDiv);
            }

            itemContainer.append(topDiv);
            itemContainer.append(imgSwiperDiv);

            //좋아요 영역
            const favDiv = document.createElement('div');
            favDiv.className = 'favCont p-2';
            const heartIcon = document.createElement('i');
            heartIcon.className = 'fa-heart pointer';
            if(item.isFav === 1) { //좋아요 O
                heartIcon.classList.add('fas');
            } else { //좋아요 X
                heartIcon.classList.add('far');
            }
            const heartCntSpan = document.createElement('span');
            heartCntSpan.innerText = item.favCnt;

            heartIcon.addEventListener('click', ()=> {
                item.isFav = 1 - item.isFav;
                fetch(`fav?ifeed=${item.ifeed}&type=${item.isFav}`)
                    .then(res => res.json())
                    .then(myJson => {
                        if(myJson === 1) {
                            switch (item.isFav) {
                                case 0: //O > X
                                    heartIcon.classList.remove('fas');
                                    heartIcon.classList.add('far');
                                    heartCntSpan.innerText--;
                                    break;
                                case 1: //X > O
                                    heartIcon.classList.remove('far');
                                    heartIcon.classList.add('fas');
                                    heartCntSpan.innerText++;
                                    break;
                            }
                        }
                    });
            });
            favDiv.append(heartIcon);
            favDiv.append(heartCntSpan);

            itemContainer.append(favDiv);
            if(item.ctnt != null) { // 글내용 영역
                const ctntDiv = document.createElement('div');
                ctntDiv.innerText = item.ctnt;
                ctntDiv.className = 'itemCtnt p-2';
                itemContainer.append(ctntDiv);
            }

            //댓글 영역
            const cmtDiv = document.createElement('div');
            const cmtListDiv = document.createElement('div');
            const cmtFormDiv = document.createElement('div');
            cmtFormDiv.className = 'p-2 d-flex flex-row div-top';

            cmtDiv.append(cmtListDiv);
            if(item.cmt != null && item.cmt.isMore === 1) {
                const moreCmtDiv = document.createElement('div');
                const moreCmtSpan = document.createElement('span');
                moreCmtSpan.className = 'pointer';
                moreCmtSpan.innerText = '댓글 더보기';
                moreCmtSpan.addEventListener('click', () => {
                    moreCmtSpan.remove();
                    fetch(`cmt?ifeed=${item.ifeed}`)
                        .then(res => res.json())
                        .then(result => {
                            result.forEach(obj => {
                                const cmtItemContainerDiv = this.makeCmtItem(obj);
                                cmtListDiv.append(cmtItemContainerDiv);
                            })
                        });
                });
                moreCmtDiv.append(moreCmtSpan);
                cmtDiv.append(moreCmtDiv);
            }


            cmtDiv.append(cmtFormDiv);


            const cmtInput = document.createElement('input');
            cmtInput.type = 'text';
            cmtInput.placeholder = '댓글을 입력하세요...';
            cmtInput.className = 'flex-grow-1 my_input back_color';
            cmtInput.addEventListener('keyup', (e) => {
                if(e.key === 'Enter') {
                    cmtBtn.click();
                }
            });

            if(item.cmt != null) { //댓글 있음
                const cmtItemContainerDiv = this.makeCmtItem(item.cmt);
                cmtListDiv.append(cmtItemContainerDiv);
            }

            const cmtBtn = document.createElement('button');
            cmtBtn.type = 'button';
            cmtBtn.innerText = '등록';
            cmtBtn.className = 'btn btn-outline-primary';
            cmtBtn.addEventListener('click', () => {
                const cmt = cmtInput.value;
                if(cmt.length === 0) {
                    alert('댓글 내용을 작성해 주세요.');
                    return;
                }

                const param = {
                    ifeed: item.ifeed,
                    cmt: cmt
                }

                fetch('cmt', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(param)
                })
                    .then(res => res.json())
                    .then(myJson => {
                        console.log(myJson);
                        switch(myJson) {
                            case 0:
                                alert('댓글을 등록할 수 없습니다.');
                                break;
                            case 1:
                                //댓글 추가한다.
                                const globalConstElem = document.querySelector('#globalConst');

                                const param = { ...globalConstElem.dataset };
                                param.cmt = cmtInput.value;

                                const cmtItemDiv = this.makeCmtItem(param);
                                cmtListDiv.append(cmtItemDiv);

                                cmtInput.value = '';
                                break;
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    });
            });

            cmtFormDiv.append(cmtInput);
            cmtFormDiv.append(cmtBtn);

            itemContainer.append(cmtDiv);
            this.containerElem.append(itemContainer);
        }
        if(this.swiper != null) { this.swiper = null; }
        this.swiper = new Swiper('.swiper', {
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            pagination: {
                el: ".swiper-pagination",
            },
            allowTouchMove: false,
            direction: 'horizontal',
            loop: false,
        });
    },
    setScrollInfinity: function(target) {
        target.addEventListener('scroll', () => {
            const {
                scrollTop,
                scrollHeight,
                clientHeight
            } = document.documentElement;

            if (scrollTop + clientHeight >= scrollHeight - 5 && this.itemLength === this.limit) {
                this.itemLength = 0;
                this.getFeedList(++this.currentPage);
            }
        }, { passive: true });
    },
    getFeedList: function(page) {
        this.showLoading();

        fetch(`${this.url}?iuserForFav=${this.iuser}&page=${page}&limit=${this.limit}`)
            .then(res => res.json())
            .then(myJson => {
                console.log(myJson);
                this.itemLength = myJson.length;
                this.makeFeedList(myJson);
            }).catch(err => {
            console.log(err);
        }).then(() => {
            this.hideLoading();
        });
    },
    makeCmtItem: function({iuser, writerProfile, writer, cmt}) {
        const cmtItemContainerDiv = document.createElement('div');
        cmtItemContainerDiv.className = 'cmtItemCont';

        //프로필
        const cmtItemProfileDiv = document.createElement('div');
        cmtItemProfileDiv.className = 'cmtItemProfile';
        const cmtItemWriterProfileImg = document.createElement('img');
        cmtItemWriterProfileImg.src = `/pic/profile/${iuser}/${writerProfile}`;
        cmtItemWriterProfileImg.className = 'profile wh30 pointer';
        cmtItemWriterProfileImg.addEventListener('click', () => {
            moveToProfile(iuser);
        });

        cmtItemProfileDiv.append(cmtItemWriterProfileImg);
        cmtItemContainerDiv.append(cmtItemProfileDiv);

        //댓글
        const cmtItemCtntDiv = document.createElement('div');
        cmtItemCtntDiv.className = 'cmtItemCtnt';
        cmtItemCtntDiv.innerHTML = `<div class="pointer" onclick="moveToProfile(${iuser});">${writer}</div><div>${cmt}</div>`;
        cmtItemContainerDiv.append(cmtItemCtntDiv);

        return cmtItemContainerDiv;
    },
    hideLoading: function() { this.loadingElem.classList.add('hide');},
    showLoading: function() { this.loadingElem.classList.remove('hide'); }
}
feedObj.iuser = document.querySelector('#globalConst').dataset.iuser;
console.log(feedObj.iuser);
feedObj.setScrollInfinity(window);
feedObj.getFeedList(1);