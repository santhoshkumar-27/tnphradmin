export class StateMaster{
    state_id: string;
    state_gid: number;
    state_name: string;

    static mapJsonToState(data: JSON) : StateMaster {
        let state = new StateMaster();
        Object.assign(state, data);
        return state;
    }
}