import { useContext, useReducer, useState } from 'react'
import './InputForm.css'
import { LoginContext } from '../../App'
import { useAuth } from '../../Hooks/useAuth'; // could also put this hook in a context hook and just access it within component instead of importing
import { useNavigate } from 'react-router-dom';
import Resizer from 'react-image-file-resizer';
import { LoadingCircle } from '../LoadingCircle/LoadingCircle';

const itemTemplate = {
    name: "",
    amount: 0,
    category: "",
    price: 0.0,
    file: null,
    ftype: ""
};

function reducer(state, action) {
    switch(action.type) {
        case "name_change":
            return {...state, name: action.value};

        case "amount_change":
            return {...state, amount: action.value};

        case "category_change":
            return {...state, category: action.value};
        
        case "price_change":
            return {...state, price: action.value};
        
        case "file_change":
            //console.log(`File changed to ${action.value}`)
            return {...state, file: action.value, ftype: action.value.type}; // Note only want to accept just one file

        default:
            return state;
    }
}
 

async function resizeFile(file, fileType) {
    return new Promise((resolve) => {
        Resizer.imageFileResizer(file, 100, 100, fileType, 100, 0, uri => { resolve(uri)}, 'base64');
    });
}



export default function InputForm() {
    const isAuthorized = useAuth();
    const { refreshItems } = useContext(LoginContext);

    const [state, dispatch] = useReducer(reducer, itemTemplate);
    const [imageurl, setURL] = useState("");

    const navigate = useNavigate();
    
    if (isAuthorized.completed) {
        if (isAuthorized.checked) {
            async function preview(file) {
                try {
                    let fileType = (file.type).split('/')[1]; fileType = fileType.toUpperCase(); console.log("Type", fileType);
                    const resized = await resizeFile(file, fileType);
                    console.log("Image", resized);
                    setURL(resized);    
                }
                catch(err) {
                    console.log(err);
                }
            }
            
            async function handleFile(file) {
                try {
                    let fileType = (file.type).split('/')[1]; fileType = fileType.toUpperCase(); console.log("Type", fileType);
                    const resized = await resizeFile(file, fileType);
                    return resized;
                }
                catch (err) {
                    throw(err);
                }

            }

            async function handleSubmit(e) {
                e.preventDefault();

                console.log(state);
                if (!state.name) { 
                    return; 
                }

                const shortenedURL = await handleFile(state.file);
                
                //const properImageName = (state.file).split("base64,/")[1]; move to backend
                //console.log(properImageName);
                //const blobImage = base64StringToBlob(properImageName); // Fix Converting base64 to blob

                try {
                    const data = {
                        name: state.name,
                        amount: state.amount,
                        category: state.category,
                        price: state.price,
                        picture: shortenedURL,
                        filetype: state.ftype
                    };

                    const options = {
                        method: "POST",
                        headers: {'Content-Type': 'application/json'},
                        credentials: 'include',
                        body: JSON.stringify(data)
                    };

                    const feed = await fetch('http://localhost:3000/create_item', options);
                    const feedback = await feed.json();

                    refreshItems(); //kconsole.log(feedback); console.log(feedback.feedback.picture);
                    navigate("/home");
                }
                catch (err) {

                } 
            }

            return (
                <>
                    <div id='inputContainer'>
                        <form id='itemForm'>
                            <div className='inputTypes'>
                                <label htmlFor='name' className='inputLabels' style={{marginRight: '1.75rem'}} > Item Name: </label>
                                <input type='text' id='name' placeholder='Enter Name:' onChange={(e) => {dispatch({type: "name_change", value: e.target.value})}} autoComplete='on'/> 
                            </div>

                            <div className='inputTypes'>                        
                                <label htmlFor='amount' className='inputLabels' style={{marginRight: '1.10rem'}} > Item Amount: </label>
                                <input type='text' id='amount' placeholder='Amount' onChange={(e) => {dispatch({type: "amount_change", value: e.target.value})}} autoComplete='on'/> 
                            </div>

                            <div className='inputTypes'>
                                <label htmlFor='category' className='inputLabels' style={{marginRight: '0.5rem'}} > Item Category: </label>
                                <input type='text' id='category' placeholder='Enter Category:' onChange={(e) => {dispatch({type: "category_change", value: e.target.value})}} autoComplete='on'/> 
                            </div>

                            <div className='inputTypes'>
                                <label htmlFor='price' className='inputLabels' style={{marginRight: '2.10rem'}} > Item Price: </label>
                                <input type='text' id='price' placeholder='Enter Price:' onChange={(e) => {dispatch({type: "price_change", value: e.target.value})}} autoComplete='on'/> 
                            </div>
                            
                            <div className='inputTypes'>
                                <label htmlFor='file' className='inputLabels'> Input a Valid JPEG or PNG: </label>
                                <input type='file' id='file' accept='image/png, image/jpeg' onChange={(e) => { dispatch({type: "file_change", value: e.target.files[0]}); preview(e.target.files[0]); }} /> 
                            </div> 

                            <button onClick={(e) => { handleSubmit(e); }}>Submit</button>                   
                        </form>
                        <div id='formImage'>
                            {(imageurl) ? <img src={imageurl} /> : <></>}
                        </div>
                    </div>
                </>
            );
        } else {
            navigate("/login");
        }
    }
    else {
        return ( <LoadingCircle/> );
    }
}