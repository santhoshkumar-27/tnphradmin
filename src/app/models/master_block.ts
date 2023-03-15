export class BlockMaster{
    block_id: string;
    block_gid: number;
    block_name: string;
    district_id: string;

    static mapJsonToBlock(data: JSON) : BlockMaster {
        let block = new BlockMaster();
        Object.assign(block, data);
        return block;
    }
}