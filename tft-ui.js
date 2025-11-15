// UI 컨트롤러 - HTML과 게임 로직 연결

let currentGame = null;
let selectedUnit = null; // {unit, fromBench} or null
let selectedItem = null; // item object or null
let draggedUnit = null;
let currentViewPlayerId = 0; // 0 = 플레이어, 1-7 = AI
let isViewingOtherPlayer = false;

// 유닛 정보 표시
function showUnitInfo(unit) {
    document.getElementById('unitInfoName').textContent = unit.name;
    document.getElementById('unitInfoTier').textContent = unit.tier;
    document.getElementById('unitInfoCost').textContent = unit.cost;
    document.getElementById('unitInfoHp').textContent = unit.stats.hp;
    document.getElementById('unitInfoAttack').textContent = unit.stats.attack;
    document.getElementById('unitInfoItems').textContent = unit.items.map(i => i.name).join(', ') || '없음';
    document.getElementById('unitInfoModal').classList.add('active');
}

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
});

// 게임 초기화
function initializeGame() {
    const difficulty = document.getElementById('difficulty').value;
    currentGame = startNewGame(difficulty);
    
    // 뷰 초기화
    currentViewPlayerId = 0;
    isViewingOtherPlayer = false;
    
    // 게임 이벤트 핸들러 설정
    currentGame.onPlanningPhase = updateUI;
    currentGame.onGameOver = showGameOver;
    currentGame.onTimerUpdate = updateTimer;
    currentGame.onBattleStart = startBattleSequence;
    currentGame.onUpgrade = (name, stars) => {
    };
    
    // 전투 결과 처리 콜백 설정
    setupBattleResultCallback();
    
    // 초기 UI 업데이트
    updateUI();
}

// 타이머 업데이트
function updateTimer(time, phase) {
    const timerLabel = document.getElementById('timerLabel');
    const timerValue = document.getElementById('timerValue');
    
    timerValue.textContent = time;
    
    if (phase === 'planning') {
        timerLabel.textContent = '준비 시간';
        if (time <= 5) {
            timerValue.style.color = '#e74c3c'; // 빨간색
        } else if (time <= 10) {
            timerValue.style.color = '#f39c12'; // 주황색
        } else {
            timerValue.style.color = '#ffd700'; // 금색
        }
    } else if (phase === 'battle') {
        timerLabel.textContent = '전투 중';
        timerValue.textContent = '⚔️';
        timerValue.style.color = '#e74c3c';
}
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 새 게임
    document.getElementById('newGameBtn').addEventListener('click', () => {
        if (confirm('새 게임을 시작하시겠습니까?')) {
            if (currentGame) {
                currentGame.stopTimer();
            }
            initializeGame();
        }
    });
    
    // 경험치 구매
    document.getElementById('buyExpBtn').addEventListener('click', () => {
        if (currentGame.buyExp()) {
            updateUI();
        }
    });
    
    // 리롤
    document.getElementById('rerollBtn').addEventListener('click', () => {
        if (currentGame.rerollShop()) {
            updateUI();
        }
    });
    
    // 모달 닫기
    document.getElementById('continueBattleBtn').addEventListener('click', () => {
        document.getElementById('battleModal').classList.remove('active');
        document.getElementById('battleResult').style.display = 'none';
        document.getElementById('battleMinimized').style.display = 'none';
        
        // 다음 라운드로 진행
        if (currentGame && !currentGame.isGameOver) {
            currentGame.nextRound();
        }
        
        // UI 업데이트
        updateUI();
    });
    
    // 유닛 정보 모달 닫기
    document.getElementById('unitInfoClose').addEventListener('click', () => {
        document.getElementById('unitInfoModal').classList.remove('active');
    });
    
    document.getElementById('restartBtn').addEventListener('click', () => {
        document.getElementById('gameOverModal').classList.remove('active');
        initializeGame();
    });
    
    // 전투 모달 최소화/복원
    document.getElementById('minimizeBattleBtn').addEventListener('click', () => {
        document.getElementById('battleModal').classList.remove('active');
        document.getElementById('battleMinimized').style.display = 'block';
    });
    
    document.getElementById('restoreBattleBtn').addEventListener('click', () => {
        document.getElementById('battleModal').classList.add('active');
        document.getElementById('battleMinimized').style.display = 'none';
    });
    
    // 스카우트 모달 닫기
    document.getElementById('closeScoutBtn').addEventListener('click', () => {
        document.getElementById('scoutModal').classList.remove('active');
    });
    
    // 스카우트 플레이어 선택
    document.getElementById('scoutPlayerSelect').addEventListener('change', (e) => {
        const playerId = parseInt(e.target.value);
        updateScoutContent(playerId);
    });
}

// UI 전체 업데이트
function updateUI() {
    if (!currentGame) return;
    
    const state = currentGame.getGameState();
    
    // 라운드 정보
    document.getElementById('stage').textContent = `Stage ${state.stage}`;
    document.getElementById('round').textContent = `Round ${state.round}`;
    
    // 라운드 타입 표시 (PVE vs PVP)
    const isPVE = currentGame.isPVERound(state.round);
    const roundTypeEl = document.getElementById('roundType');
    if (isPVE) {
        roundTypeEl.textContent = '🎯 크립 라운드';
        roundTypeEl.style.color = '#e74c3c';
    } else {
        roundTypeEl.textContent = '⚔️ PVP';
        roundTypeEl.style.color = '#3498db';
    }
    
    // 플레이어 정보
    updatePlayerInfo(state.player);
    
    // 전체 플레이어 순위
    updatePlayerList(state.allPlayers);
    
    // 전투 필드
    updateBattleField(state.player.units);
    
    // 벤치
    updateBench(state.player.bench);
    
    // 상점
    updateShop(state.shop);
    
    // 아이템
    updateItems(state.player.items);
    
    // 시너지
    updateSynergies(state.player.synergies);
}

// 플레이어 정보 업데이트
function updatePlayerInfo(player) {
    document.getElementById('playerGold').textContent = player.gold;
    document.getElementById('playerLevel').textContent = player.level;
    document.getElementById('playerExp').textContent = `${player.exp}/${currentGame.getExpToLevel(player.level)}`;
    document.getElementById('playerHealth').textContent = `${player.health} HP`;
    document.getElementById('playerHealthBar').style.width = `${player.health}%`;
    
    // 연승/연패
    let streakText = '';
    if (player.winStreak > 0) {
        streakText = `🔥 ${player.winStreak}연승 (+${Math.floor(player.winStreak / 2)}G)`;
    } else if (player.loseStreak > 0) {
        streakText = `💀 ${player.loseStreak}연패 (+${Math.min(Math.floor(player.loseStreak / 2), 3)}G)`;
    } else {
        streakText = '-';
    }
    document.getElementById('streakInfo').textContent = streakText;
}

// 플레이어 목록 업데이트 (8명 배틀로얄)
function updatePlayerList(allPlayers) {
    const container = document.getElementById('playerListContainer');
    container.innerHTML = '';
    
    // 순위별로 정렬 (살아있는 플레이어 먼저, 그 다음 탈락 순위)
    const sorted = [...allPlayers].sort((a, b) => {
        if (a.isAlive && !b.isAlive) return -1;
        if (!a.isAlive && b.isAlive) return 1;
        if (!a.isAlive && !b.isAlive) return a.placement - b.placement;
        return b.health - a.health;
    });
    
    sorted.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-item';
        
        if (player.isPlayer) {
            item.classList.add('is-player');
        }
        if (!player.isAlive) {
            item.classList.add('eliminated');
        }
        if (currentGame.currentOpponent && player.id === currentGame.currentOpponent.id) {
            item.classList.add('current-player');
        }
        
        // 현재 보고 있는 플레이어 표시
        const viewingPlayerId = player.isPlayer ? 0 : player.id;
        if (viewingPlayerId === currentViewPlayerId) {
            item.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
            item.style.borderLeft = '3px solid #3498db';
        }
        
        // 클릭 이벤트 - 필드 전환
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            switchToPlayerView(player.isPlayer ? 0 : player.id);
        });
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-item-name';
        if (player.isPlayer && window.innerWidth < 768) {
            nameSpan.textContent = '나';
        } else {
            const fullName = player.name + (player.isPlayer ? ' (나)' : '');
            nameSpan.textContent = fullName.length > 6 ? fullName.substr(0, 6) + '...' : fullName;
        }
        
        const statsDiv = document.createElement('div');
        statsDiv.className = 'player-item-stats';
        
        if (!player.isAlive) {
            statsDiv.innerHTML = `<span>🏆 ${player.placement}위</span>`;
        } else {
            statsDiv.innerHTML = `
                <span>❤️ ${player.health}</span>
                <span>⭐ ${player.level}</span>
            `;
        }
        
        item.appendChild(nameSpan);
        item.appendChild(statsDiv);
        container.appendChild(item);
    });
}

// AI 정보 업데이트 (하위 호환성)
function updateAIInfo(ai) {
    if (!ai) return;
    document.getElementById('aiLevel').textContent = ai.level;
    document.getElementById('aiUnits').textContent = ai.units;
    document.getElementById('aiHealth').textContent = `${ai.health} HP`;
    document.getElementById('aiHealthBar').style.width = `${ai.health}%`;
}

// 플레이어 필드 전환 함수
function switchToPlayerView(playerId) {
    if (!currentGame) return;
    
    currentViewPlayerId = playerId;
    isViewingOtherPlayer = playerId !== 0;
    
    // 필드 제목 업데이트
    const viewNameEl = document.getElementById('currentViewPlayerName');
    const viewIndicatorEl = document.getElementById('viewModeIndicator');
    
    if (playerId === 0) {
        viewNameEl.textContent = '내 필드';
        viewIndicatorEl.textContent = '';
        
        // 내 필드일 때는 벤치와 상점 활성화
        const benchEl = document.querySelector('.bench');
        const shopEl = document.querySelector('.shop');
        const itemStorageEl = document.querySelector('.item-storage');
        
        if (benchEl) {
            benchEl.style.opacity = '1';
            benchEl.style.pointerEvents = 'auto';
        }
        if (shopEl) {
            shopEl.style.opacity = '1';
            shopEl.style.pointerEvents = 'auto';
        }
        if (itemStorageEl) {
            itemStorageEl.style.opacity = '1';
            itemStorageEl.style.pointerEvents = 'auto';
        }
        
        // 플레이어 필드 표시
        updateBattleField(currentGame.player.units);
        updateBench(currentGame.player.bench);
        updateSynergies(calculateSynergies(currentGame.player.units));
    } else {
        // AI 플레이어 찾기
        const aiPlayer = currentGame.aiPlayers.find(ai => ai.id === playerId);
        if (!aiPlayer) return;
        
        viewNameEl.textContent = `${aiPlayer.name}의 필드`;
        viewIndicatorEl.textContent = '(관전 모드)';
        
        // 다른 플레이어 필드 볼 때는 벤치와 상점 비활성화
        const benchEl = document.querySelector('.bench');
        const shopEl = document.querySelector('.shop');
        const itemStorageEl = document.querySelector('.item-storage');
        
        if (benchEl) {
            benchEl.style.opacity = '0.5';
            benchEl.style.pointerEvents = 'none';
        }
        if (shopEl) {
            shopEl.style.opacity = '0.5';
            shopEl.style.pointerEvents = 'none';
        }
        if (itemStorageEl) {
            itemStorageEl.style.opacity = '0.5';
            itemStorageEl.style.pointerEvents = 'none';
        }
        
        // AI 필드 표시
        updateBattleField(aiPlayer.units);
        updateBench(aiPlayer.bench);
        updateSynergies(calculateSynergies(aiPlayer.units));
    }
    
    // 플레이어 목록 하이라이트 업데이트
    updatePlayerList(currentGame.getGameState().allPlayers);
}

// 전투 필드 업데이트
function updateBattleField(units) {
    const grid = document.getElementById('battleGrid');
    grid.innerHTML = '';
    
    // 4x7 그리드 생성
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 7; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // 유닛이 있는지 확인
            const unit = units.find(u => u.position && u.position.x === x && u.position.y === y);
            if (unit) {
                cell.classList.add('occupied');
                const unitEl = createUnitElement(unit, false);
                cell.appendChild(unitEl);
            }
            
            // 클릭 이벤트 (빈 칸에만)
            if (!unit) {
                cell.addEventListener('click', () => handleFieldClick(x, y, null));
                // 드래그 앤 드롭으로 벤치 유닛을 필드에 놓기
                cell.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    cell.classList.add('highlight');
                });
                cell.addEventListener('dragleave', () => {
                    cell.classList.remove('highlight');
                });
                cell.addEventListener('drop', (e) => {
                    e.preventDefault();
                    cell.classList.remove('highlight');
                    handleFieldDrop(e, x, y);
                });
            }
            grid.appendChild(cell);
        }
    }
}

// 벤치 업데이트
function updateBench(bench) {
    const benchArea = document.getElementById('benchArea');
    benchArea.innerHTML = '';
    
    document.querySelector('.bench h3').textContent = `벤치 (${bench.length}/9)`;
    
    for (let i = 0; i < 9; i++) {
        const slot = document.createElement('div');
        slot.className = 'bench-slot';
        slot.dataset.benchIndex = i;
        
        if (bench[i]) {
            const unitEl = createUnitElement(bench[i], true);
            slot.appendChild(unitEl);
        }
        
        // 내 필드일 때만 드래그 앤 드롭 활성화
        if (!isViewingOtherPlayer) {
            // 드래그 앤 드롭 지원
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('highlight');
            });
            
            slot.addEventListener('dragleave', () => {
                slot.classList.remove('highlight');
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('highlight');
                
                if (draggedUnit && !draggedUnit.fromBench) {
                    // 필드 유닛을 벤치로 이동
                    currentGame.removeUnit(draggedUnit.unit);
                    updateUI();
                }
            });
        }
        
        benchArea.appendChild(slot);
    }
}

// 상점 업데이트
function updateShop(shop) {
    const shopArea = document.getElementById('shopArea');
    shopArea.innerHTML = '';
    
    
    shop.forEach((champion, index) => {
        const slot = document.createElement('div');
        slot.className = 'shop-slot';
        
        if (champion) {
            slot.classList.add(`tier-${champion.tier}`);
            slot.innerHTML = `
                <div class="unit-cost">${champion.cost}</div>
                <div class="unit-name">${champion.name}</div>
                <div class="unit-traits">${champion.traits.join(', ')}</div>
                <div style="margin-top: 10px; font-size: 11px;">
                    <div>HP: ${champion.stats.hp}</div>
                    <div>공격력: ${champion.stats.attackDamage}</div>
                </div>
            `;
            
            slot.addEventListener('click', () => {
                if (currentGame.buyChampion(index)) {
                    updateUI();
                }
            });
        } else {
            slot.classList.add('sold');
            slot.innerHTML = '<div style="text-align: center;">판매됨</div>';
        }
        
        shopArea.appendChild(slot);
    });
}

// 유닛 요소 생성
function createUnitElement(unit, fromBench) {
    const unitEl = document.createElement('div');
    unitEl.className = `unit-card tier-${unit.tier}`;
    // 모바일: 선택된 유닛이면 하이라이트
    if (selectedUnit && selectedUnit.unit === unit && selectedUnit.fromBench === fromBench) {
        unitEl.classList.add('selected');
    }
    // 내 필드일 때만 드래그 가능
    unitEl.draggable = !isViewingOtherPlayer ? true : false;
    const stars = '⭐'.repeat(unit.stars || 1);
    unitEl.innerHTML = `
        <div class="unit-cost">${unit.cost}</div>
        <div class="unit-name">${unit.name}</div>
        <div class="unit-hp">HP: ${Math.floor(unit.currentHp || unit.stats.hp)}</div>
        <div class="unit-stars">${stars}</div>
    `;
    unitEl.dataset.from = fromBench ? 'bench' : 'field';
    unitEl.dataset.index = fromBench ? currentGame.player.bench.indexOf(unit) : currentGame.player.units.indexOf(unit);
    unitEl.dataset.dragged = 'false';

    // 모바일: 터치로 유닛 선택/배치
    if (!isViewingOtherPlayer && window.innerWidth < 768) {
        unitEl.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 이미 선택된 유닛을 다시 터치하면 선택 해제
            if (selectedUnit && selectedUnit.unit === unit && selectedUnit.fromBench === fromBench) {
                selectedUnit = null;
                updateUI();
                return;
            }
            // 유닛 선택
            selectedUnit = { unit, fromBench };
            updateUI();
        }, { passive: false });
    }

    // 데스크탑: 기존 드래그 앤 드롭/클릭 로직 유지
    if (!isViewingOtherPlayer && window.innerWidth >= 768) {
        unitEl.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            draggedUnit = { unit, fromBench };
            e.dataTransfer.setData('unitId', String(unit.id));
            e.dataTransfer.setData('fromBench', fromBench ? '1' : '0');
            unitEl.style.opacity = '0.5';
        });
        unitEl.addEventListener('dragend', (e) => {
            e.stopPropagation();
            unitEl.style.opacity = '1';
            draggedUnit = null;
            setTimeout(() => updateUI(), 100);
        });
        // 클릭: 벤치 유닛 선택, 필드 유닛 클릭시 벤치로 이동
        unitEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (fromBench) {
                selectedUnit = { unit, fromBench };
                updateUI();
            } else {
                if (confirm(`${unit.name}을(를) 벤치로 이동하시겠습니까?`)) {
                    if (currentGame.removeUnit(unit)) {
                        updateUI();
                    }
                }
            }
        });
        // 우클릭 판매
        unitEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm(`${unit.name}을(를) 판매하시겠습니까? (+${unit.cost * (unit.stars || 1)}G)`)) {
                currentGame.sellChampion(unit, fromBench);
                updateUI();
            }
        });
    }

    // 아이템 드롭 영역 (데스크탑)
    unitEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        unitEl.style.borderColor = '#ffd700';
    });
    unitEl.addEventListener('dragleave', (e) => {
        e.stopPropagation();
        unitEl.style.borderColor = '';
    });
    unitEl.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        unitEl.style.borderColor = '';
        const itemIndex = e.dataTransfer.getData('itemIndex');
        if (itemIndex !== '') {
            // 아이템을 유닛에 장착
            const item = currentGame.player.items[parseInt(itemIndex)];
            if (item) {
                if (!unit.items) unit.items = [];
                if (unit.items.length >= 3) {
                    alert('유닛은 최대 3개의 아이템만 장착할 수 있습니다!');
                    return;
                }
                // 기존 아이템과 조합 시도
                let combinedItem = item;
                for (let i = unit.items.length - 1; i >= 0; i--) {
                    const existingItem = unit.items[i];
                    const combined = combineItems(existingItem, combinedItem);
                    if (combined) {
                        unit.items.splice(i, 1);
                        combinedItem = combined;
                    }
                }
                // 아이템 장착
                unit.items.push(combinedItem);
                currentGame.player.items.splice(parseInt(itemIndex), 1);
                updateUI();
            }
        }
    });

    // 툴팁 이벤트
    unitEl.addEventListener('mouseenter', (e) => {
        showChampionTooltip(unit, e);
    });
    unitEl.addEventListener('mousemove', (e) => {
        updateTooltipPosition(e);
    });
    unitEl.addEventListener('mouseleave', () => {
        hideChampionTooltip();
    });

    return unitEl;
}

// 필드 클릭/터치 처리 (모바일: 선택-배치, 데스크탑: 기존 로직)
function handleFieldClick(x, y, unit) {
    if (window.innerWidth < 768) {
        // 모바일: 선택된 유닛이 있으면 배치 시도
        if (selectedUnit) {
            if (selectedUnit.fromBench) {
                if (currentGame.placeUnit(selectedUnit.unit, { x, y })) {
                    selectedUnit = null;
                    updateUI();
                }
            } else {
                // 필드 유닛 이동
                if (currentGame.moveUnit(selectedUnit.unit, { x, y })) {
                    selectedUnit = null;
                    updateUI();
                }
            }
        }
    } else {
        // 데스크탑: 기존 로직 (벤치 유닛만 배치)
        if (selectedUnit && selectedUnit.fromBench) {
            if (currentGame.placeUnit(selectedUnit.unit, { x, y })) {
                selectedUnit = null;
                updateUI();
            }
        }
    }
}

// 필드 드롭 처리
function handleFieldDrop(e, x, y) {
    e.preventDefault();
    if (!draggedUnit) return;
    const { unit, fromBench } = draggedUnit;
    if (!unit) return;

    // 벤치 유닛은 빈 칸에만 배치 가능 (교체 불가)
    if (fromBench) {
        const isOccupied = currentGame.player.units.some(u => u.position && u.position.x === x && u.position.y === y);
        if (isOccupied) return;
        const result = currentGame.placeUnit(unit, { x, y });
        if (result) updateUI();
        return;
    } else {
        // 필드 유닛은 빈 칸에만 이동 가능 (교체 불가)
        const isOccupied = currentGame.player.units.some(u => u.position && u.position.x === x && u.position.y === y);
        if (isOccupied) return;
        const result = currentGame.moveUnit(unit, { x, y });
        if (result) updateUI();
        return;
    }
}

// 유닛 선택
function selectUnit(unit, fromBench) {
    selectedUnit = fromBench ? unit : null;
}

// 아이템 업데이트
function updateItems(items) {
    const storage = document.getElementById('itemStorage');
    storage.innerHTML = '';
    if (items.length === 0) {
        storage.innerHTML = '<p class="empty-message">아이템 없음</p>';
        return;
    }
    items.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'item-slot';
        if (selectedItem && selectedItem.id === item.id) {
            itemEl.classList.add('selected');
        }
        itemEl.draggable = true;
        itemEl.dataset.itemIndex = index;
        itemEl.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${item.name}</div>
        `;
        // 데스크탑: 드래그 앤 드롭 조합/장착
        if (window.innerWidth >= 768) {
            itemEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('itemIndex', index);
                e.dataTransfer.setData('itemId', item.id);
                itemEl.style.opacity = '0.5';
            });
            itemEl.addEventListener('dragend', (e) => {
                itemEl.style.opacity = '1';
            });
            itemEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            itemEl.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const fromIndex = parseInt(e.dataTransfer.getData('itemIndex'));
                if (fromIndex !== index && !isNaN(fromIndex)) {
                    const itemA = currentGame.player.items[fromIndex];
                    const itemB = currentGame.player.items[index];
                    const combined = combineItems(itemA, itemB);
                    if (combined) {
                        currentGame.player.items.splice(Math.max(fromIndex, index), 1);
                        currentGame.player.items.splice(Math.min(fromIndex, index), 1);
                        currentGame.player.items.push(combined);
                        updateUI();
                    } else {
                        alert('이 조합은 불가능합니다.');
                    }
                }
            });
            itemEl.addEventListener('click', () => {
                selectedItem = item;
                alert(`${item.name}\n${item.description}\n\n유닛에게 드래그하여 장착하거나, 다른 아이템과 조합해보세요.`);
            });
        } else {
            // 모바일: 터치로 아이템 선택/장착/조합
            itemEl.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // 이미 선택된 아이템을 다시 터치하면 선택 해제
                if (selectedItem && selectedItem.id === item.id) {
                    selectedItem = null;
                    updateUI();
                    return;
                }
                // 아이템 선택
                selectedItem = item;
                updateUI();
            }, { passive: false });
        }
        storage.appendChild(itemEl);
    });
}

// 시너지 업데이트
function updateSynergies(synergyData) {
    const list = document.getElementById('synergyList');
    list.innerHTML = '';
    
    if (!synergyData || synergyData.activeSynergies.length === 0) {
        list.innerHTML = '<p class="empty-message">시너지 없음</p>';
        return;
    }
    
    synergyData.activeSynergies.forEach(synergy => {
        const item = document.createElement('div');
        item.className = 'synergy-item active';
        item.innerHTML = `
            <div class="synergy-name">${synergy.name} (${synergy.count}/${synergy.requiredCount})</div>
            <div class="synergy-effect">${synergy.effect}</div>
        `;
        list.appendChild(item);
    });
}

// 전투 시작
function startBattleSequence() {
    
    // 다른 플레이어 필드를 보고 있었다면 내 필드로 돌아오기
    if (isViewingOtherPlayer) {
        switchToPlayerView(0);
    }
    
    // 전투 모달 표시
    const modal = document.getElementById('battleModal');
    modal.classList.add('active');
    document.getElementById('battleResult').style.display = 'none';
    
    // 최소화 바 숨김
    document.getElementById('battleMinimized').style.display = 'none';
    
    // 전투 타이머 초기화 (모달과 최소화 바 모두)
    const battleTimerEl = document.getElementById('battleTimer');
    const battleTimerMiniEl = document.getElementById('battleTimerMini');
    if (battleTimerEl) {
        battleTimerEl.textContent = '60';
        battleTimerEl.style.color = '#2ecc71'; // 초록색
    }
    if (battleTimerMiniEl) {
        battleTimerMiniEl.textContent = '60';
        battleTimerMiniEl.style.color = '#2ecc71'; // 초록색
    }
    
    // 캔버스 애니메이션 시작 (전역 변수로 제어)
    window.battleAnimationRunning = true;
    animateBattle();
}

// 전투 애니메이션
function animateBattle() {
    const canvas = document.getElementById('battleCanvas');
    const ctx = canvas.getContext('2d');
    
    // 캔버스 크기 설정 (7칸 × 8칸을 적당한 크기로)
    canvas.width = 560;
    canvas.height = 720;
    
    let frame = 0;
    let animationId;
    let battleUnits = {
        player: [],
        enemy: []
    };
    
    // 전투 유닛 초기화
    function initBattleUnits() {
        // 그리드 설정 (animateBattle과 동일)
        const cols = 7;
        const rows = 8; // 4행 플레이어 + 4행 적
        const canvasWidth = 560;
        const canvasHeight = 720;
        const gridWidth = canvasWidth;
        const gridHeight = canvasHeight;
        const startX = 0;
        const startY = 0;
        const cellWidth = gridWidth / cols; // 80px
        const cellHeight = gridHeight / rows; // 90px
        
        // 플레이어 유닛 - 하단 4행 (행 4-7)
        battleUnits.player = currentGame.player.units.map((unit) => {
            const gridX = unit.position ? unit.position.x : 0; // 0-6
            const gridY = unit.position ? unit.position.y : 0; // 0-3
            
            return {
                name: unit.name,
                hp: unit.stats.hp,
                maxHp: unit.stats.hp,
                currentHp: unit.stats.hp,
                x: startX + cellWidth * (gridX + 0.5), // 셀 중앙
                y: startY + cellHeight * (gridY + 4 + 0.5), // 하단 4행 + 중앙
                color: '#27ae60',
                size: 25,
                attacking: false,
                attackFrame: 0,
                tier: unit.tier,
                cost: unit.cost,
                stars: unit.stars || 1
            };
        });
        
        // 적 유닛
        const isPVE = currentGame.isPVERound(currentGame.round);
        let enemyTeam = [];
        
        if (isPVE) {
            // PVE 라운드
            enemyTeam = generateCreeps(currentGame.round);
        } else {
            // PVP 라운드 - 현재 대전 상대의 유닛
            if (currentGame.currentOpponent && currentGame.currentOpponent.units) {
                enemyTeam = currentGame.currentOpponent.units;
            } else {
                // PVP 라운드 - 현재 대전 상대의 유닛
                if (currentGame.currentOpponent && currentGame.currentOpponent.units) {
                    enemyTeam = currentGame.currentOpponent.units;
                }
            }
        }

        // 적 유닛 - 상단 4행 (행 0-3)
        battleUnits.enemy = enemyTeam.map((unit) => {
            const gridX = unit.position ? unit.position.x : 0; // 0-6
            const gridY = unit.position ? unit.position.y : 0; // 0-3

            return {
                name: unit.name,
                hp: unit.stats.hp,
                maxHp: unit.stats.hp,
                currentHp: unit.stats.hp,
                x: startX + cellWidth * (gridX + 0.5),
                y: startY + cellHeight * (gridY + 0.5),
                color: '#e74c3c',
                size: 25,
                attacking: false,
                attackFrame: 0,
                tier: unit.tier,
                cost: unit.cost,
                stars: unit.stars || 1
            };
        });
    }
    
    // 티어별 색상
    function getTierColor(tier) {
        const colors = {
            1: '#95a5a6',
            2: '#27ae60',
            3: '#3498db',
            4: '#9b59b6',
            5: '#ffd700'
        };
        return colors[tier] || '#fff';
    }
    
    // 전투 이펙트
    function drawBattleEffects() {
        // 랜덤 공격 효과
        if (frame % 30 === 0 && battleUnits.player.length > 0 && battleUnits.enemy.length > 0) {
            const attacker = battleUnits.player[Math.floor(Math.random() * battleUnits.player.length)];
            const target = battleUnits.enemy[Math.floor(Math.random() * battleUnits.enemy.length)];
            
            if (attacker && target && target.currentHp > 0) {
                attacker.attacking = true;
                
                // 공격 라인
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(attacker.x, attacker.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
                
                // 피해 효과
                target.currentHp -= Math.random() * 100;
                if (target.currentHp < 0) target.currentHp = 0;
            }
        }
        
        // 적 공격
        if (frame % 35 === 0 && battleUnits.enemy.length > 0 && battleUnits.player.length > 0) {
            const attacker = battleUnits.enemy[Math.floor(Math.random() * battleUnits.enemy.length)];
            const target = battleUnits.player[Math.floor(Math.random() * battleUnits.player.length)];
            
            if (attacker && target && target.currentHp > 0) {
                attacker.attacking = true;
                
                // 공격 라인
                ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(attacker.x, attacker.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
                
                // 피해 효과
                target.currentHp -= Math.random() * 80;
                if (target.currentHp < 0) target.currentHp = 0;
            }
        }
        
        // 스킬 이펙트
        if (frame % 60 === 0) {
            const allUnits = [...battleUnits.player, ...battleUnits.enemy];
            allUnits.forEach(unit => {
                if (Math.random() > 0.7 && unit.currentHp > 0) {
                    // 스킬 사용 효과
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                    ctx.beginPath();
                    ctx.arc(unit.x, unit.y, unit.size * 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // 스킬 텍스트
                    ctx.fillStyle = '#ffd700';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('💥', unit.x, unit.y - 40);
                }
            });
        }
    }

    // 죽은 유닛 제거
    function updateUnits() {
        battleUnits.player = battleUnits.player.filter(u => u.currentHp > 0);
        battleUnits.enemy = battleUnits.enemy.filter(u => u.currentHp > 0);
    }
    
    const animate = () => {
        // 애니메이션이 중지되면 종료
        if (!window.battleAnimationRunning) {
            cancelAnimationFrame(animationId);
            return;
        }
        
        // 배경
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 그리드 설정
        const cols = 7;
        const rows = 8; // 4행 플레이어 + 4행 적
        const gridWidth = canvas.width; // 캔버스 전체 너비 사용
        const gridHeight = canvas.height; // 캔버스 전체 높이 사용
        const startX = 0;
        const startY = 0;
        const cellWidth = gridWidth / cols;
        const cellHeight = gridHeight / rows;
        
        // 그리드 선 그리기
        ctx.strokeStyle = 'rgba(74, 74, 74, 0.5)';
        ctx.lineWidth = 1;
        
        // 세로선
        for (let x = 0; x <= cols; x++) {
            ctx.beginPath();
            ctx.moveTo(startX + x * cellWidth, startY);
            ctx.lineTo(startX + x * cellWidth, startY + gridHeight);
            ctx.stroke();
        }
        
        // 가로선
        for (let y = 0; y <= rows; y++) {
            ctx.beginPath();
            ctx.moveTo(startX, startY + y * cellHeight);
            ctx.lineTo(startX + gridWidth, startY + y * cellHeight);
            ctx.stroke();
        }
        
        // 중앙 구분선 (4행과 5행 사이)
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(startX, startY + cellHeight * 4);
        ctx.lineTo(startX + gridWidth, startY + cellHeight * 4);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 전투 이펙트
        drawBattleEffects();
        
        // 유닛 그리기
        battleUnits.player.forEach(drawUnit);
        battleUnits.enemy.forEach(drawUnit);
        
        // 유닛 업데이트
        if (frame % 10 === 0) {
            updateUnits();
        }
        
        // 라운드 정보
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`라운드 ${currentGame.round} - 전투 중`, canvas.width / 2, 25);
        
        // 생존 유닛 수
        ctx.fillStyle = '#27ae60';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`아군: ${battleUnits.player.length}`, 10, 25);
        
        ctx.fillStyle = '#e74c3c';
        ctx.textAlign = 'right';
        ctx.fillText(`적군: ${battleUnits.enemy.length}`, canvas.width - 10, 25);
        
        frame++;
        animationId = requestAnimationFrame(animate);
    };
    
    animate();
}

// 게임 오버 표시
function showGameOver(winner, placement) {
    setTimeout(() => {
        const modal = document.getElementById('gameOverModal');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        
        if (winner === 'player') {
            title.textContent = '� 1등!';
            title.style.color = '#f39c12';
            message.textContent = '축하합니다! 배틀로얄에서 우승했습니다!';
        } else {
            title.textContent = `${placement}등`;
            title.style.color = '#e74c3c';
            message.textContent = `체력이 0이 되어 탈락했습니다. (${placement}위)`;
        }
        
        modal.classList.add('active');
    }, 1000);
}

// 전투 결과 처리를 위한 콜백 설정
function setupBattleResultCallback() {
    if (!currentGame) return;
    
    // 원본 handleBattleResult 저장
    const originalHandleBattleResult = currentGame.handleBattleResult.bind(currentGame);
    
    // 새로운 함수로 오버라이드
    currentGame.handleBattleResult = function(result, isPVE) {
        // 애니메이션 중지
        window.battleAnimationRunning = false;
        
        // 최소화된 상태라면 모달 복원
        const battleMinimized = document.getElementById('battleMinimized');
        const battleModal = document.getElementById('battleModal');
        if (battleMinimized.style.display !== 'none') {
            battleModal.classList.add('active');
            battleMinimized.style.display = 'none';
        }
        
        // 원본 로직 먼저 실행 (게임 상태 업데이트)
        originalHandleBattleResult(result, isPVE);
        
        // UI에 전투 결과 표시 (약간의 딜레이 후)
        setTimeout(() => {
            const isVictory = result.winner === 'player';
            
            document.getElementById('battleResult').style.display = 'block';
            const resultTitle = document.getElementById('battleResultTitle');
            const resultMessage = document.getElementById('battleResultMessage');
            
            if (isVictory) {
                resultTitle.textContent = '승리!';
                resultTitle.style.color = '#27ae60';
                
                if (isPVE) {
                    resultMessage.textContent = `크립을 처치했습니다! ${result.playerUnitsLeft}명 생존`;
                } else {
                    resultMessage.textContent = `AI를 물리쳤습니다! ${result.playerUnitsLeft}명 생존`;
                }
            } else {
                resultTitle.textContent = '패배';
                resultTitle.style.color = '#e74c3c';
                
                if (isPVE) {
                    resultMessage.textContent = `크립에게 패배했습니다.`;
                } else {
                    resultMessage.textContent = `AI에게 패배했습니다. ${result.enemyUnitsLeft}명 남음`;
                }
            }
        }, 500);
    };
}

// 챔피언 툴팁 표시
function showChampionTooltip(unit, event) {
    const tooltip = document.getElementById('championTooltip');
    
    // 이름과 코스트
    document.getElementById('tooltipName').textContent = unit.name;
    document.getElementById('tooltipCost').textContent = `${unit.cost} 💰 ${'⭐'.repeat(unit.stars || 1)}`;
    
    // 특성
    const traitsEl = document.getElementById('tooltipTraits');
    traitsEl.innerHTML = unit.traits.map(trait => 
        `<span class="tooltip-trait">${trait}</span>`
    ).join('');
    
    // 스탯
    const statsEl = document.getElementById('tooltipStats');
    const effectiveStats = calculateUnitStatsWithItems(unit);
    statsEl.innerHTML = `
        <div class="tooltip-stat-line"><span>체력:</span><span>${effectiveStats.hp}</span></div>
        <div class="tooltip-stat-line"><span>공격력:</span><span>${effectiveStats.attackDamage}</span></div>
        <div class="tooltip-stat-line"><span>방어력:</span><span>${effectiveStats.armor}</span></div>
        <div class="tooltip-stat-line"><span>마법저항:</span><span>${effectiveStats.magicResist}</span></div>
        <div class="tooltip-stat-line"><span>공격속도:</span><span>${effectiveStats.attackSpeed.toFixed(2)}</span></div>
        <div class="tooltip-stat-line"><span>사거리:</span><span>${effectiveStats.attackRange}</span></div>
    `;
    
    // 스킬
    const skillEl = document.getElementById('tooltipSkill');
    if (unit.skill) {
        skillEl.innerHTML = `
            <div class="tooltip-skill-name">${unit.skill.name}</div>
            <div class="tooltip-skill-desc">${unit.skill.description}</div>
            <div style="margin-top: 5px; font-size: 11px; color: #3498db;">마나: ${unit.skill.manaCost}</div>
        `;
        skillEl.style.display = 'block';
    } else {
        skillEl.style.display = 'none';
    }
    
    // 아이템
    const itemsEl = document.getElementById('tooltipItems');
    if (unit.items && unit.items.length > 0) {
        itemsEl.innerHTML = unit.items.map(item => 
            `<span class="tooltip-item">${item.icon} ${item.name}</span>`
        ).join('');
        itemsEl.style.display = 'flex';
    } else {
        itemsEl.style.display = 'none';
    }
    
    // 위치 설정
    tooltip.style.display = 'block';
    updateTooltipPosition(event);
}

// 툴팁 위치 업데이트
function updateTooltipPosition(event) {
    const tooltip = document.getElementById('championTooltip');
    if (tooltip.style.display === 'none') return;
    
    const offset = 15;
    let left = event.clientX + offset;
    let top = event.clientY + offset;
    
    // 화면 밖으로 나가지 않도록 조정
    const tooltipRect = tooltip.getBoundingClientRect();
    if (left + tooltipRect.width > window.innerWidth) {
        left = event.clientX - tooltipRect.width - offset;
    }
    if (top + tooltipRect.height > window.innerHeight) {
        top = event.clientY - tooltipRect.height - offset;
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

// 툴팁 숨김
function hideChampionTooltip() {
    const tooltip = document.getElementById('championTooltip');
    tooltip.style.display = 'none';
}

// 스카우트 모달 열기
function openScoutModal(playerId) {
    const modal = document.getElementById('scoutModal');
    const select = document.getElementById('scoutPlayerSelect');
    
    // 플레이어 선택 옵션 생성
    select.innerHTML = '';
    currentGame.aiPlayers.forEach(ai => {
        const option = document.createElement('option');
        option.value = ai.id;
        option.textContent = `${ai.name} ${ai.isAlive ? '' : '(탈락)'}`;
        if (ai.id === playerId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // 콘텐츠 업데이트
    updateScoutContent(playerId);
    
    // 모달 표시
    modal.classList.add('active');
}

// 스카우트 콘텐츠 업데이트
function updateScoutContent(playerId) {
    const player = currentGame.aiPlayers.find(ai => ai.id === playerId);
    if (!player) return;
    
    // 플레이어 정보
    document.getElementById('scoutPlayerName').textContent = player.name + (player.isAlive ? '' : ' (탈락)');
    document.getElementById('scoutHealth').textContent = `${player.health} HP`;
    document.getElementById('scoutLevel').textContent = player.level;
    document.getElementById('scoutUnitCount').textContent = player.units.length;
    
    // 시너지
    const synergies = calculateSynergies(player.units);
    const synergyList = document.getElementById('scoutSynergyList');
    
    if (synergies.length === 0) {
        synergyList.innerHTML = '<p class="empty-message">시너지 없음</p>';
    } else {
        synergyList.innerHTML = synergies.map(syn => `
            <div class="synergy-item active">
                <span class="synergy-name">${syn.name}</span>
                <span class="synergy-level">(${syn.level}/${syn.maxLevel}) ${syn.bonus}</span>
            </div>
        `).join('');
    }
    
    // 전투 필드
    const grid = document.getElementById('scoutGrid');
    grid.innerHTML = '';
    
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 7; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            const unit = player.units.find(u => u.position && u.position.x === x && u.position.y === y);
            if (unit) {
                cell.classList.add('occupied');
                const unitEl = createUnitElement(unit, true);
                cell.appendChild(unitEl);
            }
            
            grid.appendChild(cell);
        }
    }
    
}