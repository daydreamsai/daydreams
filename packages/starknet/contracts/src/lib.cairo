#[starknet::interface]
pub trait IHuginnRegistry<TContractState> {
    fn register_agent(ref self: TContractState, name: felt252, metadata_url: ByteArray);
    fn log_thought(ref self: TContractState, thought_hash: u256);
    fn get_agent(self: @TContractState, agent_id: starknet::ContractAddress) -> (felt252, ByteArray);
}

#[starknet::contract]
pub mod HuginnRegistry {
    use starknet::storage::*;
    use starknet::{ContractAddress, get_caller_address};

    #[storage]
    struct Storage {
        agents: Map<ContractAddress, AgentProfile>,
    }

    #[derive(Drop, Serde, starknet::Store)]
    pub struct AgentProfile {
        name: felt252,
        metadata_url: ByteArray,
        registered_at: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        OdinEye: OdinEye,
        RavenFlight: RavenFlight,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OdinEye {
        #[key]
        pub agent_id: ContractAddress,
        pub name: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RavenFlight {
        #[key]
        pub agent_id: ContractAddress,
        pub thought_hash: u256,
    }

    #[abi(embed_v0)]
    impl HuginnRegistryImpl of super::IHuginnRegistry<ContractState> {
        fn register_agent(ref self: ContractState, name: felt252, metadata_url: ByteArray) {
            let caller = get_caller_address();
            
            // Prevent re-registration
            let existing = self.agents.read(caller);
            assert(existing.name == 0, 'Agent already registered');
            
            // Validate name is non-empty
            assert(name != 0, 'Name cannot be empty');
            
            let timestamp = starknet::get_block_timestamp();

            let profile = AgentProfile {
                name,
                metadata_url,
                registered_at: timestamp,
            };
            self.agents.write(caller, profile);

            self.emit(Event::OdinEye(OdinEye { agent_id: caller, name }));
        }

        fn log_thought(ref self: ContractState, thought_hash: u256) {
            let caller = get_caller_address();
            
            let profile = self.agents.read(caller);
            assert(profile.name != 0, 'Agent not registered');

            self.emit(Event::RavenFlight(RavenFlight { agent_id: caller, thought_hash }));
        }

        fn get_agent(self: @ContractState, agent_id: ContractAddress) -> (felt252, ByteArray) {
            let profile = self.agents.read(agent_id);
            (profile.name, profile.metadata_url)
        }
    }
}
