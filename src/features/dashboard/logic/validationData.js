export function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return regex.test(email);
}

export function validatePhone(phone) {
    const regex =  /^(\+218|0)?[-.\s]?\(?\d{2,3}\)?[-.\s]?\d{7}$/;
    if(phone !== null){
        return regex.test(phone);
    }else{
        return true;
    }
    
}


export function checkRequiredProfileData(userProfile) {
    return userProfile.email && userProfile.username ;;
}

export function checkRequiredRegisterData(userRegister) {
    return userRegister.username && userRegister.email;
}