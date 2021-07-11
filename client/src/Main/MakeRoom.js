import React from "react";
import { v1 as uuid } from "uuid";      
import { Button } from '@material-ui/core';  // for adding styles to Button element

const MakeRoom = (props) => {
    function create() {
        const id = uuid();      // for generation of unique ID
        props.history.push(`/room/${id}`);      // tie the id at the end as url/room/id
    }

    return (
        <div style={{marginTop: '150px', color: 'white'}}>
            <h2>Video Chat Application</h2>
            <h3>Meet and chat here.</h3>
            <Button variant="contained" color="primary" onClick={create}>Create Room</Button>
        </div>
    );
}

export default MakeRoom;