function fish_prompt --description 'Write out the prompt'
    printf 'papillon@ %s> ' (set_color cyan)(prompt_pwd)
end

function fish_right_prompt 
    date +"%H:%M"
end
