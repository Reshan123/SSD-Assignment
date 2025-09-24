import { useAllPetOwnerContext } from '../../../../hooks/useAllPetOwnerContext'
import { useAllPetsContext } from "../../../../hooks/useAllPetsContext";
import { useDoctorContext } from "../../../../hooks/useDoctorContext";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom'

const UpdatePet = () => {

    const navigate = useNavigate();
    const { petID } = useParams()
    const {petOwners, dispatch: allPetOwnersDispatch} = useAllPetOwnerContext() 
    const {pets, dispatch:allPetsDispatch} = useAllPetsContext()
    const {doctor} = useDoctorContext()
    const [petDetails, setPetDetails] = useState({})
    const [error, setError] = useState('')
    const [formInput, setFormInput] = useState({
        ownerID: "",
        petName: "",
        petAge: "",
        petSpecies: "",
        petGender: "",
        petBreed: ""
    })

    useEffect(() => {
        if(pets){
            setPetDetails(pets.filter(pet => pet._id == petID))
        }
    }, [pets])

    useEffect(() => {
        if(petDetails[0]){
            setFormInput({
                ownerID: petDetails[0].ownerID,
                petName: petDetails[0].petName,
                petAge: petDetails[0].petAge,
                petSpecies: petDetails[0].petSpecies,
                petGender: petDetails[0].petGender,
                petBreed: petDetails[0].petBreed
            })
        }
    }, [petDetails])

    const handleInputChange = (input) => {
        const {name, value} = input.target;
        setFormInput(prevInput => ({...prevInput, [name]: value}))
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        // Create FormData instead of sending JSON
        const formData = new FormData();
        formData.append('ownerID', formInput.ownerID);
        formData.append('petName', formInput.petName);
        formData.append('petAge', formInput.petAge);
        formData.append('petSpecies', formInput.petSpecies);
        formData.append('petGender', formInput.petGender);
        formData.append('petBreed', formInput.petBreed);
        // Note: No files are being uploaded in this form

        try{
            const response = await fetch(`http://localhost:4000/api/pet/updatePetFromID/${petID}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${doctor.userToken}`
                    // Don't set Content-Type header - let browser set it for FormData
                },
                body: formData
            })
            const json = await response.json()
        
            if (!response.ok) {
                throw Error(json.message)
            }
            setError("")
            allPetsDispatch({type:"UPDATE PET",payload:[petID, json.message]})
            navigate('/doctor/home/pets')
        } catch (error){
            setError(error.message)
        }
    }

    return ( 
        <div className='updatePetForm'>
            <form onSubmit={handleFormSubmit}>
                <div className="formTitle">Update Pet Information</div>
                {error && (<div className="error">{error}</div>)}
                <div className='inputContainer'>
                    <label htmlFor="ownerID">Pet Owner: </label>
                    <select name="ownerID" id="ownerID" value={formInput.ownerID} onChange={(e) => handleInputChange(e)}>
                        {petOwners && (petOwners.map(owner => (<option key={owner._id} value={owner._id}>{owner.name}</option>)))}
                    </select>
                </div>
                <div className='inputContainer'>
                    <label htmlFor="petName">Pet Name: </label>
                    <input type="text" name='petName' id='petName' value={formInput.petName}  onChange={(e) => handleInputChange(e)} />
                </div>
                <div className='inputContainer'>
                    <label htmlFor="petAge">Pet Age: </label>
                    <input type="number" name="petAge" id="petAge" value={formInput.petAge} onChange={(e) => handleInputChange(e)} />
                </div>
                <div className='inputContainer'>
                    <label htmlFor="petSpecies">Pet Species: </label>
                    <input type="text" name='petSpecies' id='petSpecies' value={formInput.petSpecies} onChange={(e) => handleInputChange(e)} />
                </div>
                <div className='inputContainer'>
                    <label htmlFor="petGender">Pet Gender: </label>
                    <input type="text" name='petGender' id='petGender' value={formInput.petGender} onChange={(e) => handleInputChange(e)} />
                </div>
                <div className='inputContainer'>
                    <label htmlFor="petBreed">Pet Breed: </label>
                    <input type="text" name='petBreed' id='petBreed' value={formInput.petBreed} onChange={(e) => handleInputChange(e)} />
                </div>
                <div className='buttonContainer'>
                    <button type="submit">Submit</button>
                </div>
            </form>
        </div>
    );
}
 
export default UpdatePet;