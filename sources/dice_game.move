module dice_game::dice_game {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;

    const ENTRY_FEE: u64 = 100000000; // 1 APT (8 decimals)
    const PRIZE: u64 = 200000000; // 2 APT
    
    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_NOT_WINNER: u64 = 2;

    struct GameResult has drop {
        player: address,
        dice_roll: u64,
        won: bool,
    }

    // Play the dice game
    public entry fun play(player: &signer) {
        let player_addr = signer::address_of(player);
        
        // Transfer 1 APT from player to contract
        coin::transfer<AptosCoin>(player, @dice_game, ENTRY_FEE);
        
        // Generate random number (1-6)
        let dice_roll = get_random_number();
        
        // If dice roll is 6, player wins 2 APT
        if (dice_roll == 6) {
            coin::transfer<AptosCoin>(player, player_addr, PRIZE);
        };
    }

    // Simple random number generator (1-6)
    fun get_random_number(): u64 {
        let time = timestamp::now_microseconds();
        ((time % 6) + 1)
    }

    #[view]
    public fun get_entry_fee(): u64 {
        ENTRY_FEE
    }

    #[view]
    public fun get_prize(): u64 {
        PRIZE
    }
}